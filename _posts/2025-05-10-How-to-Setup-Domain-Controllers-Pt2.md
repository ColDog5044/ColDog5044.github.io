---
layout: post
title: "How to Setup Domain Controllers on Windows Server 2025 - Part 2"
date: 2025-05-10 12:00:00 -0400
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, domain-controller, sysadmin, networking]
---

## Introduction

Welcome to Part 2 of the Domain Controller series! Now that you have a properly configured Windows Server (from [Part 1]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt1 %})), it's time to transform it into an Active Directory Domain Controller.

This guide will walk you through installing the Active Directory Domain Services (AD DS) role and promoting your server to become the first domain controller in a new forest. This is a critical step that creates the foundation for your entire Active Directory infrastructure.

**What You'll Learn:**

- Understanding Active Directory forests, domains, and domain controllers
- Installing the AD DS role and required features
- Choosing appropriate domain naming conventions
- Configuring DNS integration
- Setting Directory Services Restore Mode (DSRM) password
- Verifying successful AD DS installation

**Why This Matters:**

**For Homelab:**
- Centralized user and computer management
- Single sign-on across all your services
- Group Policy for automated configuration
- Foundation for enterprise services (Exchange, SCCM, SCOM)
- Real-world experience with enterprise identity management

**For Enterprise:**
- Active Directory is the backbone of Windows enterprise networks
- Managing identities, computers, and resources for thousands of users
- Integration with cloud services (Azure AD, Office 365)
- Compliance and security policy enforcement
- Career-essential skill for Windows administrators

## Understanding Active Directory Concepts

Before we begin, let's clarify some key terms:

**Forest:**
- The top-level container in Active Directory
- Contains one or more domains
- Shares a common schema and global catalog
- Your first DC creates a new forest

**Domain:**
- A security and administrative boundary
- Contains users, computers, groups, and other objects
- Has its own security policies and trust relationships
- Example: `contoso.com`, `ad.contoso.com`

**Domain Controller (DC):**
- A server running AD DS that authenticates users and computers
- Stores a copy of the Active Directory database
- Provides DNS services for the domain
- Multiple DCs provide redundancy and load balancing

**Organizational Unit (OU):**
- A container within a domain
- Used to organize objects and apply Group Policy
- Can contain users, computers, groups, and other OUs

> **Homelab vs Enterprise:**  
> - **Homelab**: Typically one forest, one domain, 1-3 domain controllers
> - **Enterprise**: May have multiple forests/domains, dozens or hundreds of DCs across global locations
{: .prompt-info }

## Prerequisites

Before proceeding with this guide, ensure you have completed the following:

> **Required:**  
> Complete [Part 1: How to Setup Domain Controllers on Windows Server 2025]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt1 %}) which covers:
> - Windows Server 2025 installation
> - Administrator password configuration
> - Timezone and network settings (static IP address)
> - Server renamed with appropriate naming convention
> - All drivers installed
> - Windows updates applied
{: .prompt-info }

Your server should now be fully configured and ready to be promoted to a domain controller.

## Part 1: Install the Active Directory Domain Services Role

The AD DS role contains all the necessary components to run Active Directory, including the database, authentication services, and DNS integration.

### Install via Server Manager (GUI Method)

1. Open **Server Manager** (launches automatically on login, or press Win key and type "Server Manager").

2. Click **Manage** in the top-right corner and select **Add Roles and Features**.

3. **Before You Begin** page:
   - Read the information (optional)
   - Click **Next**

4. **Installation Type**:
   - Select **Role-based or feature-based installation**
   - Click **Next**

5. **Server Selection**:
   - Ensure your server is selected (it should be the only option)
   - Verify the server name matches what you configured in Part 1
   - Click **Next**

6. **Server Roles**:
   - Check **Active Directory Domain Services**
   - A popup will appear asking to add required features
   - Click **Add Features**
   - Click **Next**

> **What's Being Installed:**  
> When you select AD DS, it automatically includes management tools like Active Directory Users and Computers, AD Sites and Services, and other administrative consoles. These are essential for managing your domain.
{: .prompt-info }

7. **Features**:
   - Leave default selections (AD DS dependencies are already selected)
   - Optionally check **.NET Framework 3.5** if you plan to run older applications
   - Click **Next**

8. **AD DS Information**:
   - Read the overview of AD DS (good information for understanding the role)
   - Click **Next**

9. **Confirmation**:
   - Review your selections
   - Check **Restart the destination server automatically if required**
   - Click **Install**

10. **Installation Progress**:
    - Wait for installation to complete (usually 3-5 minutes)
    - You can close the window and installation continues in the background
    - Notification will appear when complete

11. **Post-Installation**:
    - You'll see a yellow notification flag in Server Manager
    - Click the flag and select **Promote this server to a domain controller**
    - This launches the AD DS Configuration Wizard

> **Don't Close the Wizard!**  
> After clicking "Promote this server to a domain controller", the Configuration Wizard opens. Proceed directly to Part 2 below - do not close this wizard or reboot the server yet.
{: .prompt-warning }

### Install via PowerShell (Alternative Method)

For those comfortable with PowerShell or building automation scripts:

```powershell
# Install AD DS role and management tools
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools

# Verify installation
Get-WindowsFeature -Name AD-Domain-Services

# Output should show:
# Display Name: Active Directory Domain Services
# Name: AD-Domain-Services
# Install State: Installed
```

> **Enterprise Automation:**  
> In production environments, installations are often scripted for consistency and repeatability. PowerShell DSC (Desired State Configuration) or Ansible can deploy dozens of DCs with identical configurations.
{: .prompt-tip }

## Part 2: Promote the Server to a Domain Controller

Now we'll configure the server as the first domain controller in a new forest using the Active Directory Domain Services Configuration Wizard.

### Deployment Configuration

1. In the **AD DS Configuration Wizard**, on the **Deployment Configuration** page:
   - Select **Add a new forest**
   - Enter your **Root domain name**

**Choosing a Domain Name - Critical Decision:**

This is one of the most important decisions you'll make. The domain name is permanent and difficult to change.

**Option 1: Use a subdomain of your registered domain (Recommended)**
- Example: `ad.yourdomain.com` or `internal.yourdomain.com`
- **Pros**: Proper DNS hierarchy, no conflicts with public internet
- **Cons**: Slightly longer names
- **Best for**: If you own a domain name

**Option 2: Use a single-label domain**
- Example: `contoso.com`
- **Pros**: Simpler naming
- **Cons**: Can cause DNS conflicts if domain exists publicly
- **Use when**: Domain doesn't exist on the internet

**Option 3: Avoid using `.local` (Not Recommended)**
- Example: `contoso.local`
- **Why avoid**: `.local` is reserved for mDNS/Bonjour (Apple services)
- Can cause DNS resolution issues
- Microsoft recommends against it

> **Warning:**  
> It is NOT recommended to use a `.local` domain for several reasons:
> - `.local` is reserved for mDNS (Multicast DNS) used by Apple Bonjour and other services
> - Can cause DNS conflicts and resolution issues
> - Microsoft officially recommends against using `.local`
> - Difficult to integrate with cloud services (Azure AD, Office 365)
>
> **Microsoft recommends** using a fully-qualified domain name (FQDN) such as `coldogstudios.com`. However, if your domain has an internet presence, use a subdomain such as `ad.coldogstudios.com` to prevent DNS issues.
{: .prompt-warning }

**Homelab Examples:**
- `ad.homelab.local` - if only internal
- `lab.yourdomain.com` - if you own yourdomain.com
- `internal.yourdomain.com` - common enterprise pattern

**Enterprise Examples:**
- `ad.company.com` - typical corporate AD domain
- `corp.company.com` - alternative corporate domain
- `internal.company.com` - common internal services domain

2. Click **Next** after entering your domain name.

### Domain Controller Options

1. **Forest functional level**:
   - Select **Windows Server 2016** or **Windows Server 2025**
   - Higher levels enable more features but require all DCs to run that OS version or newer
   - For homelab: **Windows Server 2025** (latest features)
   - For enterprise: Depends on your oldest DC

2. **Domain functional level**:
   - Select **Windows Server 2016** or **Windows Server 2025**
   - Should match or be lower than Forest functional level
   - Higher levels unlock AD features like Privileged Access Management (PAM)

3. **Specify domain controller capabilities**:
   - [x] **Domain Name System (DNS) server** - **Leave checked** (required)
   - [x] **Global Catalog (GC)** - **Leave checked** (required for first DC)
   - [ ] **Read-only domain controller (RODC)** - **Leave unchecked** (first DC must be writable)

> **Understanding DNS Integration:**  
> Active Directory requires DNS to function. By installing DNS on your DC, you create an integrated DNS zone where AD automatically registers its service records (SRV records). This is why domain-joined computers can automatically find domain controllers.
{: .prompt-info }

> **What is a Global Catalog?**  
> The Global Catalog (GC) contains a partial replica of all objects in the forest, enabling forest-wide searches. The first DC in a forest must be a GC. In homelab with a single domain, this isn't critical, but in enterprise environments with multiple domains, GCs are essential for logon and cross-domain queries.
{: .prompt-info }

4. **Directory Services Restore Mode (DSRM) password**:
   - Enter a **strong, unique password**
   - This password is separate from any domain accounts
   - **Critical**: Store this password securely - you'll need it for disaster recovery
   - Use a password manager or secure documentation

> **Note:**  
> **Directory Services Restore Mode (DSRM) Password**  
>
> The DSRM password is a critical credential used for offline maintenance and disaster recovery of Active Directory Domain Controllers. It allows administrators to:
> - Boot the DC into safe mode for repairs
> - Restore Active Directory from backup
> - Perform offline database maintenance
> - Troubleshoot replication issues
> - Recover from AD corruption
>
> This password is local to each DC and does NOT synchronize between domain controllers. It operates independent of domain authentication, allowing access even if Active Directory is completely broken.
>
> Since it's a security-sensitive account, it's recommended to:
> - Use a complex, unique password (different from domain admin passwords)
> - Store it securely in a password vault or secure documentation
> - Document which password belongs to which DC
> - Update it periodically (Microsoft recommends every 90-180 days)
> - Test recovery procedures annually
>
> **Never lose this password!** Recovery without it requires complex procedures or complete AD forest recovery.
{: .prompt-danger }

5. Click **Next**.

### DNS Options

1. **DNS delegation**:
   - You'll likely see a warning: "A delegation for this DNS server cannot be created"
   - This is **normal and safe to ignore** for homelab environments
   - This warning appears because there's no parent DNS zone to delegate to

> **Understanding DNS Delegation (Optional Reading):**  
> DNS delegation creates a pointer in a parent DNS zone to a child zone. For example, if your parent company domain is `company.com` and you're creating `ad.company.com`, delegation creates records in `company.com` pointing to your AD DNS servers. In homelab, you don't have a parent DNS infrastructure, so this warning is expected and harmless.
{: .prompt-info }

2. Click **Next**.

### Additional Options

1. **NetBIOS domain name**:
   - Automatically generated based on your domain name
   - Example: `ad.coldogstudios.com` becomes `AD`
   - Example: `coldogstudios.com` becomes `COLDOGSTUDIOS`

> **Customizing NetBIOS Names:**  
> If using a subdomain (e.g., `ad.coldogstudios.com`) and you want your actual domain name (`coldogstudios.com`) to show, change the NetBIOS name to `COLDOGSTUDIOS`.
>
> NetBIOS names are used for pre-Windows 2000 compatibility and appear in login prompts (`DOMAIN\username`). While less critical in modern environments, choosing a recognizable name improves user experience.
{: .prompt-tip }

2. Adjust the NetBIOS name if desired, then click **Next**.

### Paths

1. **Database folder**: `C:\Windows\NTDS`
2. **Log files folder**: `C:\Windows\NTDS`
3. **SYSVOL folder**: `C:\Windows\SYSVOL`

**Default paths are fine for homelab and small environments.**

**Enterprise Considerations:**
- Place database and logs on separate physical disks for performance
- Use dedicated volumes for SYSVOL for better management
- Consider SSD storage for NTDS database for improved performance
- Ensure adequate space (10GB minimum, more for large environments)

> **Warning:**  
> If you change these paths from the defaults, **document them carefully**! Most online resources and troubleshooting guides reference the default paths. Custom paths can confuse troubleshooting and recovery procedures.
{: .prompt-warning }

3. Click **Next** (leave defaults unless you have specific requirements).

### Review Options

1. Review all your configuration settings:
   - Domain name
   - NetBIOS name
   - Functional levels
   - DNS and GC roles
   - File paths

2. **Optional**: Click **View script** to see the PowerShell commands that will be executed
   - This is useful for learning automation
   - You can save this script for deploying additional DCs later
   - Example use: Deploy secondary DC with same settings

3. When satisfied with your configuration, click **Next**.

### Prerequisites Check

The wizard now performs an automatic prerequisites check:

**Green checkmarks** : All prerequisites passed - ready to install
**Yellow warnings** : Non-critical issues (usually safe to proceed)
**Red errors** : Critical issues that must be fixed before proceeding

**Common Warnings (Safe to Ignore in Homelab):**

- "A delegation for this DNS server cannot be created" - Normal if no parent DNS
- "Windows Server 2025 domain controllers have a default for the security setting..." - Informational about security changes
- "The specified computer is not a DNS server" - Normal before promotion

**Common Errors (Must Fix):**

- Network adapter using DHCP - Must have static IP
- DNS client configuration pointing to external DNS only - Should point to itself (127.0.0.1)
- Insufficient disk space - Need at least 10GB free
- Server name longer than 15 characters - Must shorten name

> **Prerequisites Validation:**  
> The wizard checks over 100 different requirements before allowing promotion. This prevents common mistakes that could break your domain. Read through all warnings and errors carefully.
{: .prompt-info }

### Install

1. After reviewing prerequisites, click **Install**.

2. **Installation process** (15-30 minutes):
   - Installing Active Directory database
   - Configuring DNS zones
   - Creating SYSVOL share
   - Initializing domain partition
   - Configuring replication
   - Setting security policies

3. **Monitor progress** in the wizard - it will show each step.

4. **Automatic reboot**: 
   - The server will automatically reboot when complete
   - Do not interrupt this process
   - After reboot, you'll log in with domain credentials

> **What's Happening Behind the Scenes:**  
> During promotion, AD DS creates the directory database (NTDS.DIT), configures DNS with AD-integrated zones, sets up Kerberos authentication, creates default security policies, and initializes the SYSVOL folder containing Group Policy templates. The reboot is necessary to complete service startup and finalize domain membership.
{: .prompt-info }

### Post-Installation Login

After the server reboots:

1. **Press Ctrl+Alt+Delete** to reach the login screen
2. **Notice the login screen now shows**: `DOMAIN\Administrator` (or your NetBIOS name)
3. Enter your Administrator password (same as before, but now it's a domain account)
4. You're now logging into a domain account, not a local account

> **Understanding Domain Accounts:**  
> After promotion, the local Administrator account becomes a domain account. Your password didn't change, but you're now authenticating against Active Directory instead of the local SAM database. This domain Administrator account has complete control over the entire domain.
{: .prompt-tip }

## Part 3: Verify Active Directory Installation

After logging back in, verify your domain controller is functioning correctly.

### Verify Using Server Manager

1. Open **Server Manager**
2. Click **AD DS** in the left sidebar
3. You should see your server listed under **Servers**
4. Status should show **Online** with no errors

### Verify Using Active Directory Tools

**Active Directory Users and Computers:**

1. Press **Win + R**, type `dsa.msc`, press **Enter**
2. Expand your domain name
3. You should see default OUs:
   - **Builtin**: Default security groups
   - **Computers**: Domain computers container
   - **Domain Controllers**: Your DC is listed here
   - **Users**: Default users and groups

**Active Directory Sites and Services:**

1. Press **Win + R**, type `dssite.msc`, press **Enter**
2. Expand **Sites** → **Default-First-Site-Name**
3. Expand **Servers**
4. Your DC should be listed with NTDS Settings

**DNS Manager:**

1. Press **Win + R**, type `dnsmgmt.msc`, press **Enter**
2. Expand your server → **Forward Lookup Zones**
3. You should see your domain zone (e.g., `ad.coldogstudios.com`)
4. The zone type should show **Active Directory-Integrated**
5. Expand the zone and verify SRV records exist in the `_tcp` folder

> **DNS SRV Records Explained:**  
> AD DS automatically registers dozens of SRV (service) records in DNS. These records tell clients how to find domain controllers, global catalogs, Kerberos servers, and LDAP servers. If these records are missing, clients cannot locate domain controllers and authentication will fail.
{: .prompt-info }

### Verify Using PowerShell

```powershell
# Get domain information
Get-ADDomain

# Get domain controller information
Get-ADDomainController

# Test domain controller functionality
Test-ComputerSecureChannel -Verbose

# Verify DNS records
Resolve-DnsName -Name _ldap._tcp.dc._msdcs.yourdomain.com -Type SRV

# Check Active Directory services
Get-Service | Where-Object {$_.Name -like "*ntds*" -or $_.Name -like "*dns*"}

# Verify SYSVOL share
Get-SmbShare | Where-Object {$_.Name -eq "SYSVOL"}

# Check domain functional level
(Get-ADDomain).DomainMode
(Get-ADForest).ForestMode
```

All commands should return proper data without errors.

## Troubleshooting Common Issues

### Issue: Promotion Fails with DNS Error

**Symptoms:** "The DNS server could not be configured" or similar DNS errors.

**Solutions:**
```powershell
# Verify DNS client settings
Get-DnsClientServerAddress

# Set DNS to loopback
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("127.0.0.1")

# Retry promotion
```

### Issue: Cannot Login After Reboot

**Symptoms:** "The trust relationship between this workstation and the primary domain failed" or cannot find domain.

**Solutions:**
- Verify you're using `DOMAIN\Administrator` format (not just `Administrator`)
- Check network connectivity
- Boot into Directory Services Restore Mode using DSRM password
- Check Event Viewer for specific errors

### Issue: SRV Records Not Registering

**Symptoms:** `nslookup _ldap._tcp.dc._msdcs.yourdomain.com` returns no records.

**Solutions:**
```powershell
# Restart Netlogon service (triggers DNS registration)
Restart-Service Netlogon

# Force DNS registration
ipconfig /registerdns

# Check netlogon.log for errors
Get-Content C:\Windows\debug\netlogon.log -Tail 50
```

### Issue: Time Synchronization Problems

**Symptoms:** Clients can't authenticate, time skew errors in Event Viewer.

**Solutions:**
```powershell
# Configure domain controller as authoritative time source
w32tm /config /manualpeerlist:"time.windows.com,0x8" /syncfromflags:MANUAL /reliable:YES /update

# Restart time service
Restart-Service w32time

# Force sync
w32tm /resync /rediscover

# Verify time source
w32tm /query /status
```

## Summary

Congratulations! You now have a fully functional Active Directory Domain Controller running Windows Server 2025.

### What You've Accomplished

- [x] Installed the Active Directory Domain Services role
- [x] Promoted the server to a domain controller
- [x] Created a new Active Directory forest and domain
- [x] Configured integrated DNS for the domain
- [x] Set up Directory Services Restore Mode password
- [x] Verified proper AD DS operation
- [x] Understood key AD concepts (forest, domain, DC, GC, DSRM)

### Homelab Learning Outcomes

You've gained practical experience with:
- Active Directory architecture and terminology
- Domain controller deployment procedures
- DNS integration with Active Directory
- Functional level considerations
- Post-installation verification techniques
- Troubleshooting common DC issues

### What's Next

**Critical: Your Domain Has a Single Point of Failure**

While your first domain controller is operational, you currently have a **single point of failure**. If this DC goes down:
- No users can authenticate to the domain
- No computers can access domain resources
- Group Policy cannot be applied
- All AD-dependent services stop functioning

In enterprise environments, this is unacceptable. Even in a homelab, having a second DC teaches you:
- High availability concepts
- Active Directory replication
- Load balancing and fault tolerance
- Real-world production architecture

**Immediate Next Steps:**

- **[Part 3]({% post_url 2025-12-23-How-to-Setup-Domain-Controllers-Pt3 %})**: Add a secondary domain controller for redundancy **(Highly Recommended)**
- **[Part 4]({% post_url 2025-12-23-How-to-Setup-Domain-Controllers-Pt4 %})**: Deploy a Read-Only Domain Controller on Server Core (Advanced)

**Additional Infrastructure Tasks:**

- Create Organizational Units (OUs) for better organization
- Configure Group Policy Objects (GPOs) for centralized management
- Join workstations and servers to the domain
- Set up user accounts and security groups
- Configure DHCP and DNS scopes
- Implement backup and disaster recovery procedures

## Resources

- Microsoft Domain Naming Conventions: <https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/naming-conventions-for-computer-domain-site-ou#domain-names>
