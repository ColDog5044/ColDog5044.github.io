---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 4"
date: 2025-12-23 11:00:00 -0500
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, domain-controller, sysadmin, networking, rodc, server-core, powershell]
---

## Introduction

In this fourth part of the Domain Controller series, we'll configure a Read-Only Domain Controller (RODC) using Windows Server Core. Server Core provides a minimal installation with no graphical user interface, reducing the attack surface and resource requirements. Combined with an RODC, this makes an ideal configuration for branch offices or remote locations with limited physical security.

**Why This Matters for Your Homelab:**

While you may not have branch offices in your homelab, configuring an RODC on Server Core provides excellent hands-on experience with:
- **Command-line administration** - Essential skills for managing production servers
- **Security concepts** - Understanding read-only replicas and credential caching
- **Remote management** - PowerShell remoting and headless server management
- **Resource efficiency** - Running more services on limited hardware

These skills directly translate to enterprise environments where Server Core RODCs are deployed in remote sites, DMZs, or cloud regions.

> **Prerequisites:**  
> - A functioning Active Directory domain with at least one writable domain controller
> - Completed [Part 1](How-to-Setup-Domain-Controllers-Pt1.md), [Part 2](How-to-Setup-Domain-Controllers-Pt2.md), and [Part 3](How-to-Setup-Domain-Controllers-Pt3.md)
> - Domain Administrator credentials
> - Windows Server installation media
{: .prompt-info }

## What is a Read-Only Domain Controller (RODC)?

An RODC is a domain controller that hosts read-only partitions of the Active Directory database. Key characteristics include:

- **Read-Only AD Database**: No direct writes to Active Directory (changes replicate from writable DCs)
- **Credential Caching**: Selectively caches user credentials for authentication
- **Unidirectional Replication**: Replicates from writable DCs but doesn't replicate changes back
- **Administrator Role Separation**: Local administrators don't need domain admin rights
- **Filtered Attribute Set**: Sensitive attributes (like BitLocker keys) are not replicated

### Use Cases for RODCs

**Enterprise Use Cases:**
- **Branch Offices**: Locations with limited physical security
- **DMZ/Perimeter Networks**: Reduce risk of credential theft
- **Remote Sites**: Locations with unreliable WAN connectivity
- **Partner Locations**: Sites managed by third parties
- **Cloud/Edge Deployments**: Distributed authentication with minimal risk

**Homelab Learning Scenarios:**
- **Security Testing**: Simulate a compromised DC in a branch office
- **Disaster Recovery**: Test AD recovery when only an RODC remains
- **PowerShell Practice**: Master command-line administration without GUI safety nets
- **Network Segmentation**: Understand how RODCs work in isolated network segments
- **Performance Testing**: See the resource savings of Server Core firsthand

> **Homelab Tip:**  
> Even if you don't need an RODC for your homelab, setting one up teaches you advanced AD concepts and PowerShell skills that are highly valued in enterprise IT. Many companies have dozens or hundreds of RODCs in branch offices.
{: .prompt-tip }

## Why Use Server Core?

Windows Server Core offers several advantages:

- **Smaller Attack Surface**: Fewer components mean fewer vulnerabilities
- **Reduced Resource Usage**: Lower CPU and memory footprint (saves ~4GB RAM vs Desktop Experience)
- **Minimal Maintenance**: Fewer updates and reboots required
- **Better Performance**: More resources available for services
- **Remote Management**: Forces automation and remote administration best practices

> **Homelab Benefits:**  
> Server Core is perfect for homelabs with limited resources. A Server Core DC can run comfortably on 2GB RAM vs 4-6GB for Desktop Experience. This means you can run more VMs on the same hardware. Plus, you'll gain valuable PowerShell skills that are essential for modern Windows administration.
{: .prompt-tip }

> **Note:**  
> Server Core requires management via PowerShell, command line, or remote tools. This guide will cover all necessary PowerShell commands. Don't worry - by the end of this guide, you'll be comfortable managing servers without a GUI!
{: .prompt-info }

## Part 1: Install Windows Server Core

### Install from ISO

1. Boot from the Windows Server installation media.
2. Select language, time, and keyboard preferences.
3. Click **Install now**.
4. Select **Windows Server 20XX (Desktop Experience)** → Change this to **Windows Server 20XX**.

> **Important:**  
> Make sure to select the edition **without** "Desktop Experience" to get Server Core.
{: .prompt-tip }

5. Accept the license terms.
6. Select **Custom: Install Windows only (advanced)**.
7. Select the target drive and click **Next**.
8. Wait for installation to complete (server will reboot automatically).

### Initial Configuration

After installation, you'll see a command prompt window asking you to set the Administrator password.

1. **Set Administrator Password**:  
   Enter a strong password twice when prompted.

2. You'll be logged in to a command prompt interface.

## Part 2: Configure Server Core Using SConfig

Windows Server Core includes **SConfig**, a text-based configuration utility.

### Launch SConfig

```cmd
sconfig
```

### Configure Basic Settings

Use the following menu options in SConfig:

**Option 2 - Computer Name**:
```
Enter selection: 2
Enter new computer name: ORG-RODC1
```
Server will prompt to restart - select **Yes**.

**After restart, launch SConfig again and continue:**

**Option 8 - Network Settings**:
```
Enter selection: 8
Select network adapter: 1
1) Set Network Adapter Address
Enter selection: 1
S) Static IP Address
IP Address: 192.168.1.15
Subnet Mask: 255.255.255.0
Default Gateway: 192.168.1.1
```

**Configure DNS Servers**:
```
Enter selection: 8
Select network adapter: 1
2) Set DNS Servers
Preferred DNS Server: 192.168.1.10  (Your primary DC)
Alternate DNS Server: 192.168.1.11  (Your secondary DC)
```

**Option 9 - Date and Time**:
```
Enter selection: 9
```
Configure your timezone.

**Option 6 - Download and Install Updates**:
```
Enter selection: 6
A) All quality updates
```
Install all available updates (this may take a while).

**Exit SConfig**:
```
Enter selection: 15
```

## Part 3: Configure Server via PowerShell

Now we'll use PowerShell for more advanced configuration.

### Enter PowerShell

```cmd
powershell
```

### Verify Network Configuration

```powershell
# Check network adapter configuration
Get-NetIPConfiguration

# Verify DNS settings
Get-DnsClientServerAddress
```

### Join the Server to the Domain

```powershell
# Join the domain
$domain = "ad.yourdomain.com"
$credential = Get-Credential -Message "Enter Domain Admin credentials"
Add-Computer -DomainName $domain -Credential $credential -Restart
```

> **Note:**  
> The server will restart automatically. Log back in using domain credentials: `DOMAIN\Administrator`
{: .prompt-info }

### After Restart - Verify Domain Join

```powershell
# Start PowerShell
powershell

# Verify domain membership
Get-ComputerInfo | Select-Object CsDomain, CsDomainRole

# Test domain connectivity
Test-ComputerSecureChannel -Verbose
```

## Part 4: Pre-Stage the RODC Account (Optional but Recommended)

Pre-staging an RODC account allows you to delegate the RODC installation to non-domain administrators and configure advanced RODC settings.

### On a Writeable Domain Controller (GUI)

1. Open **Active Directory Users and Computers**.
2. Navigate to **Domain Controllers** OU.
3. Right-click **Domain Controllers** → **Pre-create a Read-only domain controller account**.
4. Click **Next** through the welcome screen.
5. **Network Credentials**: Use current credentials or specify different ones.
6. **Computer Name**: Enter `ORG-RODC1`.
7. **Site**: Select the appropriate site or use **Default-First-Site-Name**.
8. **Additional Domain Controller Options**:
   - ☑ **DNS server**
   - ☑ **Global catalog**
   - ☑ **Read-only domain controller (RODC)**
9. **Delegation of RODC Installation**: Optionally specify a user or group that can attach the server to this account.
10. **Password Replication Policy**:
    - **Allowed**: Add security groups whose credentials can be cached (e.g., branch office users)
    - **Denied**: Keep default denied groups (Domain Admins, Enterprise Admins, etc.)

> **Understanding Password Replication Policy (PRP):**  
> The PRP controls which user credentials are cached on the RODC. In production, you'd add groups like "Branch Office Users" to the allowed list. For homelab purposes, you can create a test group with a few user accounts to experiment with credential caching.
>
> **Homelab Exercise**: Create a group called "RODC Test Users", add a test user to it, and add this group to the allowed list. Later, you can verify if credentials are cached using PowerShell commands we'll cover.
{: .prompt-tip }

11. Click through to complete the pre-staging.

### Alternative: Pre-Stage via PowerShell

From a writeable DC:

```powershell
# Pre-create RODC account
Add-ADDSReadOnlyDomainControllerAccount `
    -DomainControllerAccountName "ORG-RODC1" `
    -DomainName "ad.yourdomain.com" `
    -SiteName "Default-First-Site-Name" `
    -DelegatedAdministratorAccountName "DOMAIN\RODCAdmins" `
    -InstallDNS `
    -AllowPasswordReplicationAccountName @("DOMAIN\BranchOfficeUsers") `
    -DenyPasswordReplicationAccountName @("DOMAIN\Domain Admins", "DOMAIN\Enterprise Admins")
```

## Part 5: Install AD DS Role on Server Core

Back on the Server Core machine:

### Install the AD DS Role

```powershell
# Install Active Directory Domain Services role
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools

# Verify installation
Get-WindowsFeature | Where-Object {$_.Name -eq "AD-Domain-Services"}
```

### Import the AD DS Deployment Module

```powershell
# Import the ADDSDeployment module
Import-Module ADDSDeployment
```

## Part 6: Promote Server Core to RODC

### Option A: Attach to Pre-Staged Account

If you pre-staged the RODC account:

```powershell
# Get domain admin credentials
$credential = Get-Credential -Message "Enter Domain Admin credentials"

# Promote to RODC using pre-staged account
Install-ADDSDomainController `
    -DomainName "ad.yourdomain.com" `
    -Credential $credential `
    -ReadOnlyReplica `
    -UseExistingAccount `
    -InstallDns `
    -SafeModeAdministratorPassword (ConvertTo-SecureString "YourDSRMPassword!" -AsPlainText -Force) `
    -Force `
    -Verbose
```

### Option B: Promote Without Pre-Staging

If you didn't pre-stage the account:

```powershell
# Get domain admin credentials
$credential = Get-Credential -Message "Enter Domain Admin credentials"

# Create secure password for DSRM
$dsrmPassword = ConvertTo-SecureString "YourDSRMPassword!" -AsPlainText -Force

# Promote to RODC
Install-ADDSDomainController `
    -DomainName "ad.yourdomain.com" `
    -Credential $credential `
    -ReadOnlyReplica `
    -InstallDns `
    -SiteName "Default-First-Site-Name" `
    -SafeModeAdministratorPassword $dsrmPassword `
    -AllowPasswordReplicationAccountName @("DOMAIN\BranchOfficeUsers") `
    -DenyPasswordReplicationAccountName @("DOMAIN\Denied RODC Password Replication Group") `
    -Force `
    -Verbose
```

> **Important:**  
> Replace `YourDSRMPassword!` with a strong password and store it securely. Document the DSRM password in your password manager.
{: .prompt-warning }

> **Homelab Note:**  
> The AllowPasswordReplicationAccountName and DenyPasswordReplicationAccountName parameters control which accounts can have their credentials cached. For learning purposes, start with a conservative policy (only allow specific test users) and expand it as you become comfortable with the concept.
{: .prompt-info }

The server will automatically reboot after promotion.

## Part 7: Verify RODC Installation

After the server reboots, log back in with domain credentials.

### Enter PowerShell

```cmd
powershell
```

### Verify Domain Controller Status

```powershell
# Check if server is a domain controller
Get-ADDomainController -Identity $env:COMPUTERNAME

# Verify RODC status
(Get-ADDomainController -Identity $env:COMPUTERNAME).IsReadOnly

# Check replicated partitions
Get-ADDomainController -Identity $env:COMPUTERNAME | Select-Object -ExpandProperty Partitions
```

### Check DNS Registration

```powershell
# Verify DNS records
nslookup $env:COMPUTERNAME

# Query for DC SRV records
nslookup -type=SRV _ldap._tcp.dc._msdcs.yourdomain.com
```

### Test Replication

```powershell
# Show replication partners
repadmin /showrepl

# Check replication summary
repadmin /replsummary

# Verify SYSVOL replication
Get-ChildItem \\$env:COMPUTERNAME\SYSVOL
```

### Verify Password Replication Policy

```powershell
# Check allowed password replication accounts
Get-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -Allowed

# Check denied password replication accounts
Get-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -Denied
```

### Check Cached Credentials

```powershell
# View cached credentials on RODC
Get-ADDomainControllerPasswordReplicationPolicyUsage -Identity $env:COMPUTERNAME
```

## Part 8: Manage Server Core RODC

### Remote Management Options

> **Why This Matters:**  
> Remote management is a critical skill in enterprise environments. You can't physically access servers in data centers or remote branch offices. Mastering these techniques in your homelab prepares you for real-world scenarios.
{: .prompt-info }

**Option 1: Remote PowerShell** (Most Common in Enterprise)

From a Windows machine with RSAT installed:

```powershell
# Establish remote PowerShell session
$credential = Get-Credential
$session = New-PSSession -ComputerName ORG-RODC1.ad.yourdomain.com -Credential $credential

# Enter interactive session
Enter-PSSession $session

# Or run commands remotely
Invoke-Command -Session $session -ScriptBlock {
    Get-ADDomainController -Identity $env:COMPUTERNAME
}

# Close session
Remove-PSSession $session
```

**Option 2: Windows Admin Center**

Install Windows Admin Center on a management workstation to manage Server Core through a web interface.

**Option 3: MMC Snap-ins**

Use MMC snap-ins from a management workstation to remotely manage the RODC.

### Daily Management Commands

```powershell
# Check system status
Get-ComputerInfo | Select-Object WindowsVersion, OsHardwareAbstractionLayer

# Check disk space
Get-PSDrive C

# View event logs
Get-EventLog -LogName System -Newest 20
Get-EventLog -LogName "Directory Service" -Newest 20

# Check services
Get-Service | Where-Object {$_.Name -like "*ntds*"}
Get-Service | Where-Object {$_.Name -like "*dns*"}

# Check network connectivity
Test-NetConnection -ComputerName DC1.ad.yourdomain.com -Port 389
Test-NetConnection -ComputerName DC1.ad.yourdomain.com -Port 636

# Windows Update status
Get-WindowsUpdateLog
```

### Manage Password Replication Policy

```powershell
# Add user/group to allowed list
Add-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -AllowedList "DOMAIN\BranchUser1"

# Add user/group to denied list
Add-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -DeniedList "DOMAIN\SensitiveGroup"

# Remove from allowed list
Remove-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -AllowedList "DOMAIN\BranchUser1"

# Pre-populate credentials (force caching)
Add-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -AllowedList "DOMAIN\BranchUsers" -Prepopulate
```

> **Homelab Exercise - Test Credential Caching:**  
> 1. Create a test user: `New-ADUser -Name "TestUser" -AccountPassword (ConvertTo-SecureString "P@ssw0rd!" -AsPlainText -Force) -Enabled $true`
> 2. Add user to allowed list (see command above)
> 3. Have the user authenticate to the RODC (log in to a client computer pointing to the RODC)
> 4. Check if credentials are cached: `Get-ADDomainControllerPasswordReplicationPolicyUsage -Identity $env:COMPUTERNAME`
>
> This hands-on practice helps you understand how credential caching works in branch office scenarios.
{: .prompt-tip }

### Monitor RODC Replication

```powershell
# Create a scheduled task to log replication status
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-Command `"repadmin /showrepl > C:\Logs\replication-status.txt`""
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
Register-ScheduledTask -TaskName "RODC Replication Check" -Action $action -Trigger $trigger -User "SYSTEM"
```

## Part 9: Security Best Practices for RODCs

### Physical Security

**Enterprise Best Practices:**
- Place RODCs in locations where physical access is limited
- Use BitLocker to encrypt the drives
- Implement physical access controls and monitoring
- Install in locked server rooms or cabinets
- Use tamper-evident seals on hardware

**Homelab Application:**
While you may not have branch offices, understanding these security concepts is crucial. In your homelab:
- Practice enabling BitLocker on Server Core using PowerShell
- Document security procedures as if this were a real branch office
- Consider this RODC as a "less trusted" DC to understand the security model

> **Real-World Context:**  
> In enterprise environments, branch offices often have minimal physical security - maybe just a closet with basic locks. RODCs are designed for exactly this scenario, where a stolen server wouldn't compromise the entire domain.
{: .prompt-info }

### Password Replication Policy

```powershell
# Review and minimize allowed accounts
Get-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -Allowed

# Ensure sensitive accounts are denied
$sensitiveGroups = @(
    "Domain Admins",
    "Enterprise Admins",
    "Schema Admins",
    "Backup Operators",
    "Account Operators"
)

foreach ($group in $sensitiveGroups) {
    Add-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -DeniedList "DOMAIN\$group"
}
```

### Credential Caching Audit

```powershell
# Regularly audit which credentials are cached
Get-ADDomainControllerPasswordReplicationPolicyUsage -Identity $env:COMPUTERNAME | 
    Select-Object AccountName, LastLogonDate, LastPasswordChangeDate |
    Export-Csv C:\Logs\cached-credentials.csv -NoTypeInformation
```

### Administrator Role Separation

Grant local administrator rights on the RODC without giving domain admin rights:

```powershell
# On a writable DC, add delegated admin to RODC
Add-ADDomainControllerPasswordReplicationPolicy -Identity ORG-RODC1 -AllowedList "DOMAIN\RODCLocalAdmins"

# Grant local admin rights on RODC
Invoke-Command -ComputerName ORG-RODC1 -ScriptBlock {
    Add-LocalGroupMember -Group "Administrators" -Member "DOMAIN\RODCLocalAdmins"
}
```

### Enable Advanced Auditing

```powershell
# Enable RODC authentication auditing
auditpol /set /subcategory:"Authentication Policy Change" /success:enable /failure:enable
auditpol /set /subcategory:"Credential Validation" /success:enable /failure:enable

# Monitor RODC-specific events
# Event ID 4662: RODC password replication request
# Event ID 4768: Kerberos TGT request
```

## Part 10: Troubleshooting Server Core RODC

### RODC Not Replicating

```powershell
# Check replication errors
repadmin /showrepl /errorsonly

# Force replication
repadmin /syncall /AdeP

# Check knowledge consistency checker
repadmin /kcc

# Verify RPC connectivity
Test-NetConnection -ComputerName DC1.ad.yourdomain.com -Port 135
```

### DNS Issues

```powershell
# Re-register DNS
ipconfig /registerdns

# Restart DNS service
Restart-Service DNS

# Verify DNS server addresses
Get-DnsClientServerAddress

# Test DNS resolution
Resolve-DnsName yourdomain.com
Resolve-DnsName _ldap._tcp.dc._msdcs.yourdomain.com -Type SRV
```

### SYSVOL Not Replicating

```powershell
# Check DFS Replication service
Get-Service DFSR

# Restart DFS Replication
Restart-Service DFSR

# Check SYSVOL state
dfsrdiag ReplicationState
dfsrmig /GetGlobalState
```

### Time Synchronization Problems

```powershell
# Configure time sync from domain hierarchy
w32tm /config /syncfromflags:domhier /update

# Resync time
w32tm /resync /force

# Check time source
w32tm /query /status
w32tm /query /source
```

### Cannot Authenticate Users

```powershell
# Verify user credentials are cached
Get-ADDomainControllerPasswordReplicationPolicyUsage -Identity $env:COMPUTERNAME -AccountName "DOMAIN\username"

# Check password replication policy
Get-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -Allowed

# Force credential cache
Add-ADDomainControllerPasswordReplicationPolicy -Identity $env:COMPUTERNAME -AllowedList "DOMAIN\username" -Prepopulate

# Check connectivity to writable DC
Test-ComputerSecureChannel -Verbose
```

### Server Core Won't Boot

Boot into Directory Services Restore Mode (DSRM):

1. During boot, press **F8** to access Advanced Boot Options
2. Select **Directory Services Restore Mode**
3. Log in with local Administrator and DSRM password
4. Troubleshoot using command prompt and PowerShell

### Convert Server Core to GUI (Emergency Only)

If you need GUI access temporarily:

```powershell
# Install Desktop Experience
Install-WindowsFeature Server-Gui-Mgmt-Infra, Server-Gui-Shell -Restart

# To convert back to Server Core
Uninstall-WindowsFeature Server-Gui-Mgmt-Infra, Server-Gui-Shell -Restart
```

> **Warning:**  
> Converting between Server Core and Desktop Experience requires significant disk space and a reboot. Only do this if absolutely necessary.
{: .prompt-warning }

## Part 11: Monitoring and Maintenance

### Create Monitoring Scripts

```powershell
# Save this as C:\Scripts\rodc-health-check.ps1
$logPath = "C:\Logs\rodc-health-check.txt"

"========================================" | Out-File $logPath
"RODC Health Check - $(Get-Date)" | Out-File $logPath -Append
"========================================" | Out-File $logPath -Append

# DC Status
"Domain Controller Status:" | Out-File $logPath -Append
Get-ADDomainController -Identity $env:COMPUTERNAME | 
    Select-Object Name, IsReadOnly, IsGlobalCatalog, Site | 
    Out-File $logPath -Append

# Replication Status
"`nReplication Summary:" | Out-File $logPath -Append
repadmin /replsummary | Out-File $logPath -Append

# Service Status
"`nCritical Services:" | Out-File $logPath -Append
$services = @("NTDS", "DNS", "DFSR", "W32Time", "Netlogon")
foreach ($svc in $services) {
    Get-Service $svc | Select-Object Name, Status | Out-File $logPath -Append
}

# Disk Space
"`nDisk Space:" | Out-File $logPath -Append
Get-PSDrive C | Select-Object Used, Free | Out-File $logPath -Append

# Cached Credentials Count
"`nCached Credentials:" | Out-File $logPath -Append
$cached = Get-ADDomainControllerPasswordReplicationPolicyUsage -Identity $env:COMPUTERNAME
"Total cached: $($cached.Count)" | Out-File $logPath -Append
```

### Schedule Health Check

```powershell
# Create scheduled task to run health check daily
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\rodc-health-check.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount
Register-ScheduledTask -TaskName "RODC Health Check" -Action $action -Trigger $trigger -Principal $principal
```

### Update Management

```powershell
# Check for updates
$updateSession = New-Object -ComObject Microsoft.Update.Session
$updateSearcher = $updateSession.CreateUpdateSearcher()
$updates = $updateSearcher.Search("IsInstalled=0")

# Install updates using SConfig
sconfig
# Select option 6 (Download and Install Updates)
```

## Summary

You now have a fully functional Read-Only Domain Controller running on Windows Server Core:

- [x] Server Core installed with minimal footprint
- [x] RODC configured with unidirectional replication
- [x] Password replication policy configured
- [x] Remote management capability established
- [x] Security best practices implemented
- [x] Monitoring and maintenance procedures in place

This configuration provides secure, efficient authentication services for branch offices or remote locations while minimizing security risks and administrative overhead.

**Homelab Learning Outcomes:**

By completing this guide, you've gained practical experience with:
- **Server Core Administration**: Managing Windows Server without a GUI using PowerShell and command-line tools
- **RODC Concepts**: Understanding read-only domain controllers, credential caching, and unidirectional replication
- **Remote Management**: Using PowerShell remoting, Windows Admin Center, and MMC for headless server administration
- **Security Principles**: Implementing role separation, password replication policies, and filtered attribute sets
- **Enterprise Architecture**: Understanding how large organizations deploy domain controllers in remote locations

These skills are directly applicable to real-world enterprise environments where you'll manage hundreds of remote servers without ever seeing a GUI.

## Benefits Achieved

**Technical Benefits:**
- **Enhanced Security**: Read-only AD database prevents unauthorized modifications
- **Reduced Attack Surface**: Server Core installation with minimal components
- **Efficient Resource Usage**: Lower CPU and memory requirements (2GB vs 4-6GB)
- **Credential Protection**: Selective credential caching limits exposure
- **Remote Management**: PowerShell-based management encourages automation
- **Physical Security**: Suitable for locations with limited security controls

**Career Benefits (Homelab to Enterprise):**
- **Cost Savings**: In production, Server Core licensing is identical but requires less hardware
- **Scalability Knowledge**: Understanding how to deploy DCs to 100+ remote sites
- **Automation Experience**: PowerShell skills gained here apply to Azure, AWS, and hybrid environments
- **Troubleshooting Ability**: Command-line troubleshooting translates to Linux and cloud platforms

## Next Steps

- Configure client computers to use the RODC for authentication
- Implement monitoring and alerting for RODC health
- Document the password replication policy for your organization
- Set up regular backup and disaster recovery procedures
- Consider implementing BitLocker for additional disk encryption
- Review and audit cached credentials regularly

## Resources

- [Read-Only Domain Controllers Overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/rodc/read-only-domain-controller-updates)
- [Server Core Installation Option](https://learn.microsoft.com/en-us/windows-server/administration/server-core/what-is-server-core)
- [Administer Server Core](https://learn.microsoft.com/en-us/windows-server/administration/server-core/server-core-administer)
- [RODC Password Replication Policy](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/deploy/rodc/rodc-password-replication-policy)
- [Install-ADDSDomainController](https://learn.microsoft.com/en-us/powershell/module/addsdeployment/install-addsdomaincontroller)
- [PowerShell Remoting](https://learn.microsoft.com/en-us/powershell/scripting/learn/remoting/running-remote-commands)
