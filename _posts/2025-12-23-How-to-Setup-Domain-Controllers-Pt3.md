---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 3"
date: 2025-12-23 10:40:00 -0500
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, domain-controller, sysadmin, networking, replication]
---

## Introduction

In this third part of the Domain Controller series, we'll cover how to add a secondary (replica) domain controller to your existing Active Directory forest. Adding additional domain controllers provides redundancy, load balancing, and improved fault tolerance for your Active Directory environment.

> **Prerequisites:**  
> Before proceeding, ensure you have completed [Part 1](How-to-Setup-Domain-Controllers-Pt1.md) and [Part 2](How-to-Setup-Domain-Controllers-Pt2.md) to set up your primary domain controller.
{: .prompt-info }

## Benefits of Multiple Domain Controllers

- **High Availability**: If one DC fails, authentication and directory services continue
- **Load Distribution**: Multiple DCs share authentication requests across the network
- **Site Redundancy**: Place DCs in different physical locations for disaster recovery
- **Reduced WAN Traffic**: Users authenticate to local DCs instead of across slow links
- **Faster Replication**: Changes replicate between DCs automatically

## Prepare the Secondary Domain Controller

### Install Windows Server

Follow the same steps from [Part 1](How-to-Setup-Domain-Controllers-Pt1.md) to install Windows Server 2025 on your second server:

1. Download and install Windows Server 2025
2. Set a strong Administrator password
3. Configure timezone settings
4. Install necessary drivers
5. Run Windows Updates

### Configure Network Settings

1. **Assign a Static IP Address**:  
   Configure a static IP in the same subnet as your primary DC.

2. **Configure DNS Settings**:  
   - Set the **Preferred DNS server** to the IP address of your primary domain controller
   - Optionally set an **Alternate DNS server** (like `8.8.8.8` or another DC if available)

> **Important:**  
> The DNS server must point to your existing domain controller, as it hosts the DNS records for your Active Directory domain.
{: .prompt-warning }

3. **Rename the Server**:  
   Use a meaningful name following your naming convention (e.g., `ORG-DC2`, `ORG-DC3`, etc.).

### Join the Server to the Domain

Before promoting the server to a domain controller, it must first be joined to the domain.

1. Open **Server Manager** and click on the server name in the left pane.
2. Under **Properties**, click on the **Computer name**.
3. Click **Change** next to "To rename this computer or change its domain".
4. Select **Domain** and enter your domain name (e.g., `ad.coldogstudios.com`).
5. Enter credentials of a domain administrator account when prompted.
6. Restart the server when prompted.

> **Note:**  
> After joining the domain, you can log in using domain credentials instead of the local administrator account.
{: .prompt-info }

## Install Active Directory Domain Services Role

1. Open **Server Manager**.
2. Navigate to **Manage > Add Roles and Features**.
3. Click **Next** through the wizard pages until you reach **Server Roles**.
4. Select **Role-based or feature-based installation**.
5. Ensure your server is selected.
6. Check **Active Directory Domain Services**.
7. Click **Add Features** when prompted to install required features.
8. Click **Next** through the Features and AD DS pages.
9. Check **Restart the destination server automatically if required**.
10. Click **Install** to begin the installation.

## Promote the Server to a Domain Controller

1. After the AD DS role installation completes, click **Promote this server to a domain controller** in Server Manager.

2. **Select Deployment Configuration**:  
   - Choose **Add a domain controller to an existing domain**
   - Ensure your domain name is displayed correctly
   - Click **Select...** to provide credentials if needed (use a Domain Admin account)

3. **Domain Controller Options**:  
   - Ensure **Domain Name System (DNS) server** is checked (recommended)
   - Ensure **Global Catalog (GC)** is checked (recommended for most scenarios)
   - Leave **Read-only domain controller (RODC)** unchecked unless you specifically need an RODC
   - Select your **Site name** (or use the default if you haven't configured AD Sites and Services)
   - Enter a strong **Directory Services Restore Mode (DSRM)** password

> **Note:**  
> The DSRM password should be documented and stored securely, just like on your primary DC. It doesn't need to be the same password as your primary DC.
{: .prompt-info }

4. **DNS Options**:  
   - If you see a warning about DNS delegation, you can safely ignore it in most scenarios
   - The wizard will verify that DNS records can be created

5. **Additional Options**:  
   - The wizard will show a domain controller from which it will replicate
   - Verify the replication source is your primary DC or another available DC
   - You can click **Change...** to select a different replication source if needed

6. **Paths**:  
   - Review the default paths for the AD DS database, log files, and SYSVOL
   - Change these if needed (must use local drives, not network locations)

> **Tip:**  
> For best performance, consider placing the AD DS database and logs on separate physical disks if possible.
{: .prompt-tip }

7. **Review Options**:  
   - Review your configuration settings
   - Optionally click **View script** to see the PowerShell equivalent

8. **Prerequisites Check**:  
   - The wizard will run a prerequisites check
   - Review any warnings (some warnings are informational and can be safely ignored)
   - Common warnings include:
     - "A delegation for this DNS server cannot be created" - safe to ignore in most cases
     - "Windows Server 2025 domain controllers have a default for the security setting..." - informational

9. Click **Install** to begin the promotion process.

> **Warning:**  
> The server will automatically reboot after the promotion completes.
{: .prompt-warning }

## Verify Replication

After the server reboots and you log back in, verify that Active Directory replication is working correctly.

### Check Replication Status

Open **PowerShell** as Administrator and run:

```powershell
# Show replication partners
repadmin /showrepl

# Check replication status
repadmin /replsummary

# Force replication from all partners
repadmin /syncall /AdeP
```

### Verify SYSVOL Replication

```powershell
# Check DFS Replication state
dfsrdiag ReplicationState
```

Ensure the SYSVOL share is being replicated:

```powershell
# List SYSVOL contents
Get-ChildItem \\$env:COMPUTERNAME\SYSVOL
```

### Verify DNS Records

Check that the new DC has registered its DNS records:

```powershell
# Query DNS for DC records
nslookup -type=SRV _ldap._tcp.dc._msdcs.yourdomain.com

# Check for your new DC's host record
nslookup DC2.yourdomain.com
```

### Test Domain Controller Functionality

```powershell
# Test DC diagnostic
dcdiag /v

# Run a comprehensive DC test
dcdiag /c /v

# Check Active Directory health
Get-ADDomainController -Filter * | Select-Object Name, IPv4Address, OperatingSystem, IsGlobalCatalog
```

## Configure Sites and Services (Optional)

If you have multiple physical locations, configure Active Directory Sites and Services to optimize replication:

1. Open **Active Directory Sites and Services** from Server Manager > Tools
2. Create new sites for each physical location
3. Create subnet objects and associate them with sites
4. Configure site links and replication schedules
5. Move domain controllers to their appropriate sites

## Post-Deployment Best Practices

### Update DNS Settings

Now that you have multiple DCs:

1. **Update DHCP scope** to provide both DC IP addresses as DNS servers
2. **Update static clients** to use both DCs for DNS (primary and alternate)
3. **Update firewall/router** DNS settings if applicable

### Configure Time Synchronization

Ensure time synchronization is properly configured:

```powershell
# On secondary DC, configure to sync from primary DC
w32tm /config /syncfromflags:domhier /update
w32tm /resync

# Verify time source
w32tm /query /status
```

### Backup Both Domain Controllers

Configure Windows Server Backup or your enterprise backup solution to backup both domain controllers, including System State.

### Monitor Replication Health

Set up monitoring to alert on replication failures:

```powershell
# Create a scheduled task to check replication daily
repadmin /showrepl > C:\Logs\replication-status.txt
```

## Troubleshooting Common Issues

### Replication Not Starting

```powershell
# Force knowledge consistency checker (KCC) to run
repadmin /kcc

# Check for replication errors
repadmin /showrepl /errorsonly
```

### DNS Issues

```powershell
# Re-register DNS records
ipconfig /registerdns

# Restart DNS service
Restart-Service DNS
```

### SYSVOL Not Replicating

```powershell
# Check DFS Replication service
Get-Service DFSR

# Restart DFS Replication
Restart-Service DFSR

# Check SYSVOL state
dfsrmig /GetGlobalState
```

### Time Synchronization Issues

```powershell
# Resynchronize time
w32tm /resync /force

# Check time difference between DCs
w32tm /stripchart /computer:DC1.yourdomain.com
```

## Summary

You now have a redundant Active Directory infrastructure with multiple domain controllers. This setup provides:

- High availability for authentication services
- Automatic failover if one DC becomes unavailable  
- Load balancing for client authentication requests
- Protection against data loss through multi-master replication

Remember to regularly monitor replication health and maintain consistent configurations across all domain controllers.

## Next Steps

- Configure Group Policy Objects (GPOs)
- Set up Organizational Units (OUs)
- Implement proper backup and disaster recovery procedures
- Consider setting up an Enterprise Certificate Authority (see upcoming guide)

## Resources

- [Install a Replica Windows Server Domain Controller](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/install-a-replica-windows-server-2012-domain-controller-in-an-existing-domain--level-200-)
- [Active Directory Replication Concepts](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/replication/active-directory-replication-concepts)
- [Repadmin Command Reference](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/cc770963(v=ws.11))
- [Active Directory Sites and Services](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/understanding-active-directory-site-topology)
