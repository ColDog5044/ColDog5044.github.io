---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 1"
date: 2025-05-10 10:30:00 -0400
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, domain-controller, sysadmin, networking]
---

## Introduction

Setting up an Active Directory Domain Controller is a foundational skill for any Windows system administrator. Whether you're building a homelab to learn enterprise technologies or deploying a production environment, understanding how to properly install and configure Windows Server is essential.

This is Part 1 of our comprehensive Domain Controller series, focusing on the initial installation and configuration of Windows Server 2025. We'll walk through every step from creating installation media to preparing the server for Active Directory promotion.

**Why This Matters for Your Homelab:**

- **Centralized Authentication**: Manage users and computers from a single location
- **Group Policy**: Configure settings across multiple machines automatically
- **Learning Enterprise Skills**: Active Directory skills are in high demand
- **Foundation for Services**: Many enterprise services require AD (Exchange, SCCM, SQL Server)
- **Career Development**: Hands-on AD experience is invaluable for IT careers

**Enterprise Context:**

In production environments, domain controllers are the backbone of network identity and access management. Proper installation and configuration is critical - a poorly configured DC can cause authentication failures, replication issues, and security vulnerabilities affecting thousands of users.

> **Prerequisites:**  
> - A physical server or virtual machine with:
>   - 2GB RAM minimum (4GB recommended)
>   - 60GB disk space minimum
>   - Network connectivity
> - Windows Server 2025 ISO or installation media
> - Basic understanding of networking (IP addresses, DNS, subnets)
{: .prompt-info }

## Part 1: Install Windows Server

### Download Windows Server 2025

1. **Obtain the ISO file**:  
   - Visit the [Microsoft Evaluation Center](https://www.microsoft.com/en-us/evalcenter/download-windows-server-2025)
   - Select **ISO Downloads** and choose your language
   - Download the ISO file (approximately 5-6 GB)

> **Homelab Tip:**  
> The evaluation version is free and fully functional for 180 days. This is perfect for homelab use and learning. You can also convert to a licensed version later.
{: .prompt-tip }

> **Enterprise Note:**  
> Production environments use volume licensing (KMS, MAK, or AVMA) rather than evaluation editions. Always use licensed copies in production.
{: .prompt-info }

### Create Bootable Installation Media

**Option 1: Rufus (Recommended for USB)**

1. Download [Rufus](https://rufus.ie/) (free, portable tool).
2. Insert a USB drive (8GB or larger - **all data will be erased**).
3. Launch Rufus:
   - **Device**: Select your USB drive
   - **Boot selection**: Click **SELECT** and choose your Windows Server ISO
   - **Partition scheme**: GPT (for UEFI) or MBR (for legacy BIOS)
   - **File system**: NTFS
4. Click **START** and wait for completion (5-10 minutes).

**Option 2: Virtual Machine (Hyper-V, VMware, Proxmox)**

If installing on a VM, simply mount the ISO directly:
- **Hyper-V**: Settings → SCSI Controller → DVD Drive → Image file
- **VMware**: Edit Settings → CD/DVD → Use ISO image
- **Proxmox**: Upload ISO to storage, attach to VM

> **VM Configuration Recommendations:**  
> - **CPU**: 2 cores minimum (4 recommended)
> - **RAM**: 4GB minimum (6-8GB for better performance)
> - **Disk**: 60GB minimum (thin provisioned)
> - **Network**: Bridged or host-only depending on your network setup
{: .prompt-tip }

### Boot from Installation Media

1. **Physical Server**:
   - Insert the USB drive
   - Boot the server and enter BIOS/UEFI (usually F2, F12, Del, or Esc)
   - Change boot order to prioritize USB/UEFI
   - Save and exit

2. **Virtual Machine**:
   - Power on the VM with ISO attached
   - VM will automatically boot from ISO

### Install Windows Server

1. **Language and Keyboard**:
   - Select your language, time format, and keyboard layout
   - Click **Next**

2. **Install Now**:
   - Click **Install now**
   - Wait for setup to initialize

3. **Product Key** (if prompted):
   - Enter your product key, or
   - Select **I don't have a product key** for evaluation

4. **Select Edition**:
   - Choose **Windows Server 2025 Standard (Desktop Experience)** or **Datacenter (Desktop Experience)**
   - **Standard vs Datacenter**: For homelab, Standard is sufficient. Datacenter adds unlimited virtualization rights.
   - **Desktop Experience**: Includes the GUI. Avoid "Server Core" for your first DC unless you're comfortable with command-line only.

> **Understanding Editions:**  
> - **Standard**: Limited to 2 VMs, perfect for homelab
> - **Datacenter**: Unlimited VMs, used in large virtualization environments
> - **Desktop Experience**: Full GUI interface
> - **Server Core**: No GUI, command-line only (covered in Part 4)
{: .prompt-info }

5. **Accept License Terms**:
   - Read and accept the license agreement
   - Click **Next**

6. **Installation Type**:
   - Select **Custom: Install Windows only (advanced)**
   - This performs a clean installation

7. **Drive Selection**:
   - Select the drive where you want to install Windows Server
   - If you don't see your drives, click **Load driver** to install storage drivers
   - Click **Next** to begin installation

8. **Wait for Installation**:
   - The server will copy files, install features, and reboot several times
   - This typically takes 15-30 minutes
   - **Do not** interrupt the process

> **Troubleshooting:**  
> If installation fails or hangs:
> - Verify ISO integrity (re-download if needed)
> - Check hardware compatibility
> - For VMs, ensure sufficient resources allocated
> - Disable Secure Boot in UEFI if having boot issues
{: .prompt-warning }

## Part 2: Initial Server Configuration

After installation completes, the server will reboot and prompt you for initial configuration.

### Set Administrator Password

1. **Create Strong Password**:
   - You'll be prompted to set a password for the built-in Administrator account
   - Requirements: At least 8 characters, mix of uppercase, lowercase, numbers, and symbols
   - Example: `P@ssw0rd2025!` (but use something unique)

2. **Document the Password**:
   - Store in a password manager (KeePass, Bitwarden, 1Password)
   - **Never** use simple passwords in production

> **Security Best Practice:**  
> The local Administrator account has complete control over the server. In enterprise environments, this password is often changed regularly and stored in secure vaults with audit trails.
{: .prompt-warning }

### Initial Login

1. Press **Ctrl+Alt+Delete** to reach the login screen
2. Enter the Administrator password you just created
3. Press **Enter**

**Server Manager** will launch automatically - this is your primary management interface.

### Configure Time and Region Settings

1. In **Server Manager**, click the **server name** in the left pane
2. Under **Properties**, click the **Time zone** link
3. Set your correct timezone
4. Click **OK**

> **Why This Matters:**  
> Active Directory relies heavily on time synchronization. If domain controllers have time differences greater than 5 minutes (default), authentication will fail. Setting the correct timezone now prevents issues later.
{: .prompt-info }

### Assign a Static IP Address

Domain controllers must have static IP addresses - DHCP addresses can change and break DNS/AD functionality.

**Configure via Server Manager:**

1. In **Server Manager**, click **Local Server** in the left pane
2. Click the **Ethernet** link next to "IPv4 address assigned by DHCP"
3. Right-click your network adapter and select **Properties**
4. Select **Internet Protocol Version 4 (TCP/IPv4)** and click **Properties**
5. Select **Use the following IP address**:
   - **IP address**: Choose an address from your network (e.g., `192.168.1.11`)
   - **Subnet mask**: Usually `255.255.255.0` for home networks
   - **Default gateway**: Your router's IP (e.g., `192.168.1.1`)
6. **DNS servers**:
   - **Preferred**: Point to itself initially: `127.0.0.1` (loopback)
   - **Alternate**: Your router or external DNS (e.g., `1.1.1.1`)
7. Click **OK** to apply settings

> **DNS Configuration Explained:**  
> We set the preferred DNS to `127.0.0.1` (localhost) because once this server becomes a DC, it will host DNS. The loopback address ensures the DC can resolve its own DNS records. For now, if you need internet access before promoting to DC, you can temporarily set your router or `1.1.1.1` as preferred DNS.
{: .prompt-tip }

**Verify Network Configuration:**

```powershell
# Open PowerShell and verify settings
Get-NetIPAddress -AddressFamily IPv4
Get-DnsClientServerAddress

# Test connectivity
Test-Connection 1.1.1.1 -Count 2
Test-Connection google.com -Count 2
```

**Homelab IP Planning:**

Consider using a dedicated IP range for infrastructure:
- **192.168.1.10-19**: Domain Controllers
- **192.168.1.20-29**: Servers (file, print, app servers)
- **192.168.1.100-254**: DHCP range for workstations

**Enterprise IP Planning:**

Production environments use more structured IP schemes:
- Separate VLANs for servers, workstations, DMZ
- Documented IP Address Management (IPAM)
- Reserved ranges for infrastructure services

### Rename the Server

Meaningful server names make administration much easier, especially with multiple servers.

**Naming Conventions:**

**Homelab Examples:**
- `LAB-DC01`, `LAB-DC02` (simple, functional)
- `HOME-DC1`, `HOME-DC2`
- `DC01`, `DC02` (minimalist)

**Enterprise Naming Conventions:**
- `LOC-ROLE-##` format: `NYC-DC-01`, `CHI-DC-02`
- Include location, role, and sequence number
- Documented in organization's naming standards

**Rename the Server:**

1. In **Server Manager** → **Local Server**
2. Click the current computer name next to **Computer name**
3. Click **Change**
4. Enter your chosen name (e.g., `LAB-DC01`)
5. Click **OK**
6. Click **OK** to acknowledge restart requirement
7. Click **Close**
8. Click **Restart Now**

The server will reboot with the new name.

> **Note:**  
> You must rename the server **before** promoting it to a domain controller. Renaming a DC after promotion requires complex procedures and should be avoided.
{: .prompt-warning }

### Install Drivers and VM Tools

**Physical Servers:**
- Install vendor-specific drivers (RAID controllers, network adapters)
- Check manufacturer's website for latest drivers
- Install any management tools (Dell OpenManage, HP iLO, etc.)

**Virtual Machines:**

**Hyper-V:**
```powershell
# Install Integration Services (usually included by default)
# Verify integration services are running
Get-VMIntegrationService -VMName "LAB-DC01"
```

**VMware:**
1. In VM menu, select **Install VMware Tools**
2. Run the installer from the mounted CD drive
3. Reboot after installation

**Proxmox:**
```powershell
# Install QEMU Guest Agent
# Download from Proxmox ISO or Fedora repository
# Install via Add/Remove Programs or PowerShell
```

> **Why Guest Tools Matter:**  
> VM guest tools/integration services provide better performance, accurate time synchronization, graceful shutdowns, and improved snapshot capabilities. Always install them on VMs.
{: .prompt-tip }

### Run Windows Updates

Keeping your server patched is critical for security and stability.

**Update via Settings:**

1. Open **Settings** (Win key + I)
2. Navigate to **Windows Update**
3. Click **Check for updates**
4. Install all available updates
5. Reboot if required
6. Repeat until no more updates are available

**Update via PowerShell:**

```powershell
# Install PSWindowsUpdate module
Install-Module PSWindowsUpdate -Force

# Import the module
Import-Module PSWindowsUpdate

# Check for updates
Get-WindowsUpdate

# Install all updates
Install-WindowsUpdate -AcceptAll -AutoReboot

# View update history
Get-WUHistory | Select-Object -First 10
```

> **Enterprise Approach:**  
> Production environments use Windows Server Update Services (WSUS) or Configuration Manager (SCCM) to centrally manage updates, test patches, and control deployment schedules. Servers are updated in maintenance windows to minimize downtime.
{: .prompt-info }

### Verify Server Readiness

Before proceeding to Part 2 (AD DS installation), verify all configuration:

**Checklist:**

```powershell
# Verify computer name
$env:COMPUTERNAME

# Verify IP configuration
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1"}

# Verify DNS settings
Get-DnsClientServerAddress -AddressFamily IPv4

# Verify Windows version
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsHardwareAbstractionLayer

# Test internet connectivity
Test-Connection 1.1.1.1 -Count 2

# Check for pending updates
(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search("IsInstalled=0").Updates.Count

# Verify time sync
w32tm /query /status
```

All checks should pass before moving to Part 2.

## Troubleshooting Common Issues

### Network Adapter Not Recognized

**Symptoms:** No network adapter visible during or after installation.

**Solutions:**
- Download drivers from manufacturer's website on another computer
- Copy drivers to USB drive
- During installation, click "Load driver" and browse to driver files
- For VMs, ensure network adapter type is supported (E1000e, VMXNET3, VirtIO)

### Cannot Access Internet After IP Configuration

**Symptoms:** Can ping IP addresses but not domain names.

**Solutions:**
```powershell
# Verify DNS configuration
Get-DnsClientServerAddress

# Set temporary DNS to use public DNS
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("1.1.1.1","1.0.0.1")

# Test DNS resolution
Resolve-DnsName google.com

# Flush DNS cache if needed
Clear-DnsClientCache
```

### VM Performance Issues

**Symptoms:** Slow installation or poor performance.

**Solutions:**
- Increase RAM allocation (minimum 4GB)
- Add more CPU cores (minimum 2)
- Use SSD storage if possible
- Install guest tools/integration services
- Disable unnecessary services

### Activation Issues

**Symptoms:** Windows not activated or evaluation period errors.

**Solutions:**
```powershell
# Check activation status
slmgr /xpr

# For evaluation, extend trial period (3 times maximum)
slmgr /rearm
Restart-Computer

# Enter product key if you have one
slmgr /ipk YOUR-PRODUCT-KEY
slmgr /ato
```

## Summary

You've now successfully installed and configured Windows Server 2025 with all the prerequisites needed for Active Directory deployment.

### What You've Accomplished

- [x] Downloaded and created Windows Server installation media
- [x] Installed Windows Server 2025 (Desktop Experience)
- [x] Set a strong Administrator password
- [x] Configured timezone settings
- [x] Assigned a static IP address with proper DNS configuration
- [x] Renamed the server with a meaningful name
- [x] Installed necessary drivers and VM tools
- [x] Applied all available Windows updates
- [x] Verified server readiness for AD DS installation

### Homelab Learning Outcomes

By completing this guide, you've gained:
- Understanding of Windows Server installation process
- Knowledge of proper network configuration for infrastructure servers
- Experience with PowerShell for server management
- Foundation for building enterprise-style infrastructure

### What's Next

Your server is now ready for Active Directory Domain Services installation. In [Part 2]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt2 %}), we'll:
- Install the Active Directory Domain Services role
- Promote the server to a domain controller
- Create your first Active Directory forest and domain
- Configure DNS integration

## Resources

  - Windows Server 2025 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2025>
  - Windows Server 2022 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2022>
  - Windows Server 2019 Evaluation: <https://www.microsoft.com/en-us/evalcenter/download-windows-server-2019>