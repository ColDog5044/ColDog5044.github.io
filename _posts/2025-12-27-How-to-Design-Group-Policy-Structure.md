---
layout: post
title: "How to Design Group Policy Structure"
date: 2025-12-27 08:00:00 -0500
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, group-policy, gpo, sysadmin, security, best-practices]
---

## Introduction

**Your Journey So Far:**

> **Important:**  
> This guide builds upon the Domain Controller series and OU structure guide. If you haven't completed these yet, **review them first**:
> - [Domain Controller Series]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt1 %}) (Parts 1-4)
> - [Organizational Unit Structure Guide]({% post_url 2025-12-26-How-to-Design-Organizational-Unit-Structure %})
{: .prompt-warning }

You've built a complete Active Directory infrastructure:
- [x] Installed and configured domain controllers
- [x] Designed a logical Organizational Unit structure

Now comes the most powerful feature of Active Directory: **Group Policy**.

**What is Group Policy?**

Group Policy allows you to configure and enforce settings across hundreds or thousands of computers and users from a central location. Instead of manually configuring each machine, you define policies once and let Active Directory automatically apply them.

**Examples of What Group Policy Can Do:**

**For Computers:**
- Install software automatically
- Configure Windows Update settings
- Set desktop wallpaper and screensaver
- Configure Windows Firewall rules
- Disable USB storage devices
- Map network drives
- Set password policies
- Configure power management
- Deploy security baselines

**For Users:**
- Redirect folders (Documents, Desktop) to network shares
- Deploy printers automatically
- Configure Internet Explorer/Edge settings
- Hide Control Panel options
- Set login scripts
- Restrict software installation
- Configure VPN settings

**Why Group Policy Structure Matters:**

Like OU design, poorly designed Group Policy leads to:
- Conflicting policies (settings that override each other unexpectedly)
- Slow login times (processing hundreds of unnecessary GPOs)
- Troubleshooting nightmares (can't figure out which GPO is applying which setting)
- Security gaps (missing critical security settings)
- Accidental lockouts (applying the wrong policy to the wrong objects)

A well-designed GPO structure:
- Fast login and policy processing
- Predictable and consistent behavior
- Easy troubleshooting
- Scalable and maintainable
- Secure by default

> **Prerequisites:**  
> - A proper OU structure in place (see the [OU Structure Guide]({% post_url 2025-12-26-How-to-Design-Organizational-Unit-Structure %}))
> - A functioning Active Directory domain with domain controllers
> - Domain Administrator credentials
> - Understanding of your policy requirements (even basic homelab policies)
{: .prompt-info }

## Understanding Group Policy Fundamentals

### What is a Group Policy Object (GPO)?

A GPO is a collection of settings that can be applied to users or computers. Each GPO can contain:
- **Computer Configuration**: Settings applied to computers (regardless of who logs in)
- **User Configuration**: Settings applied to users (regardless of which computer they use)

### Group Policy Processing Order (LSDOU)

Group Policy is applied in a specific order. Understanding this is critical:

**L - Local**
- Local Group Policy on the computer itself
- Processed first, lowest priority

**S - Site**
- GPOs linked to the Active Directory site
- Rare in small environments

**D - Domain**
- GPOs linked at the domain level
- Apply to all users/computers in the domain

**O - Organizational Unit**
- GPOs linked to OUs
- Most common and most specific
- **Highest priority**

**Later policies override earlier policies** (OU policies win over Domain policies).

**Example:**
```
1. Local Policy: Set wallpaper to blue
2. Domain GPO: Set wallpaper to red
3. OU GPO: Set wallpaper to green

Result: Wallpaper is GREEN (OU policy wins)
```

### GPO Linking vs. GPO Objects

**Critical Distinction:**

- **GPO Object**: The actual policy with settings (created in Group Policy Management)
- **GPO Link**: Attaching that GPO to an OU, domain, or site

**One GPO can be linked to multiple locations:**
```
"Workstation Security Baseline" GPO
├── Linked to: OU=Workstations
├── Linked to: OU=Laptops
└── Linked to: OU=Kiosks
```

This is efficient! Edit the GPO once, and all three OUs get the update.

### GPO Inheritance

By default, child OUs inherit GPOs from parent OUs.

**Example:**
```
Domain (GPO: Domain Baseline)
└── OU=Corporate (GPO: Corporate Security)
    └── OU=Users (GPO: User Settings)
        └── OU=IT (GPO: IT User Settings)
```

Users in the IT OU receive **all four GPOs**:
1. Domain Baseline
2. Corporate Security
3. User Settings
4. IT User Settings

**Block Inheritance:** Prevents parent GPOs from applying (use sparingly!)
**Enforced:** Forces a GPO to apply even if child OUs block inheritance (powerful!)

> **Warning:**  
> Block Inheritance and Enforced should be rare exceptions. Overusing them creates unpredictable behavior and troubleshooting nightmares.
{: .prompt-warning }

### Computer vs. User Configuration

**Computer Configuration:**
- Applies during computer startup
- Runs in the SYSTEM context
- Examples: Install software, Windows Update settings, Firewall rules

**User Configuration:**
- Applies during user login
- Runs in the user's context
- Examples: Folder redirection, mapped drives, desktop wallpaper

**Best Practice:** Disable unused sections to improve performance.

If a GPO only has Computer settings, disable User Configuration:
```powershell
# Disable User Configuration for faster processing
Get-GPO -Name "Workstation Security Baseline" | Set-GPO -GpoStatus UserSettingsDisabled
```

## Group Policy Design Principles

### 1. Purpose-Based GPO Naming

**Bad Examples:**
- `New Group Policy Object`
- `GPO1`
- `Test GPO`
- `Bob's GPO`

**Good Examples:**
- `Computer-Security-Baseline`
- `User-Folder-Redirection`
- `Workstation-Windows-Update`
- `Server-Hardening-CIS`

**Naming Convention Template:**
```
[Type]-[Category]-[Purpose]-[Optional Details]

Examples:
Computer-Security-Baseline
User-Drive-Mapping-Sales
Computer-Software-AdobeReader
User-Desktop-Wallpaper-Corporate
```

### 2. Granular GPOs (One Purpose Per GPO)

**Bad Approach (Monolithic GPO):**
```
"Everything GPO"
├── Computer: Security settings
├── Computer: Software installation
├── Computer: Windows Update settings
├── User: Folder redirection
├── User: Drive mappings
└── User: Desktop settings
```

**Problem:** Can't apply parts selectively. What if laptops need different software than desktops?

**Good Approach (Granular GPOs):**
```
Computer-Security-Baseline (link to all computers)
Computer-Software-Office365 (link to specific OUs)
Computer-WindowsUpdate-Prod (link to production computers)
User-FolderRedirection-All (link to all users)
User-DriveMapping-Finance (link to finance OU)
```

**Benefits:**
- Mix and match policies
- Easy to troubleshoot (know which GPO does what)
- Reusable across different OUs
- Clear documentation

### 3. Layered Security Model

**Defense in Depth Approach:**

**Layer 1: Domain Baseline (All Objects)**
- Password policies
- Account lockout policies
- Basic security settings
- Event log settings

**Layer 2: Object Type (Workstations/Servers/Users)**
- Workstation-specific security hardening
- Server-specific security hardening
- User-specific restrictions

**Layer 3: Role-Based (IT/Finance/HR)**
- Department-specific software
- Department-specific drive mappings
- Role-specific access

**Layer 4: Special Cases (Kiosks/VIP Users/Test Systems)**
- Highly restrictive for kiosks
- Less restrictive for test labs
- Enhanced security for executives

### 4. Test Before Production

**Always test GPOs before deploying widely:**

**Recommended Testing Process:**

1. **Create test OU structure:**
```
Testing
├── Test Users
└── Test Computers
```

2. **Create test accounts and computers**

3. **Link GPO to test OU first**

4. **Verify settings apply correctly:**
   - Run `gpupdate /force` on test computer
   - Check with `gpresult /h C:\Temp\GPReport.html` (as Administrator)

5. **Fix any issues**

6. **Deploy to production OUs**

> **Enterprise Best Practice:**  
> Large organizations use **Pilot Groups** - create GPO with security filtering for a pilot group, test for 1-2 weeks, then roll out to everyone.
{: .prompt-info }

## Recommended GPO Structure

### Homelab GPO Structure

Perfect for learning and small environments:

**Domain-Level GPOs:**
```
Domain: yourdomain.com
├── Domain-Default-Password-Policy (enforced)
├── Domain-Security-Baseline
└── Domain-EventLog-Settings
```

**Computer GPOs:**
```
OU: Computers
├── OU: Workstations
│   ├── Computer-Security-Workstation
│   ├── Computer-WindowsUpdate-Workstation
│   └── Computer-Power-Management
├── OU: Laptops
│   ├── Computer-Security-Laptop
│   ├── Computer-WindowsUpdate-Laptop
│   └── Computer-BitLocker-Laptop
└── OU: Kiosks
    └── Computer-Kiosk-Lockdown
```

**Server GPOs:**
```
OU: Servers
├── Computer-Security-Server-Baseline
├── Computer-WindowsUpdate-Servers
└── Computer-Firewall-Servers
```

**User GPOs:**
```
OU: Users
├── OU: Standard Users
│   ├── User-Desktop-Settings
│   ├── User-Folder-Redirection
│   └── User-Drive-Mapping
├── OU: IT
│   └── User-IT-Tools
└── OU: Admins
    └── User-Admin-Restrictions (block personal OneDrive, etc.)
```

### Small Business GPO Structure

**Domain-Wide:**
- Domain-Password-Policy (enforced)
- Domain-Account-Lockout (enforced)
- Domain-Security-Baseline
- Domain-Event-Auditing

**Computers:**
- Computer-Security-Baseline-CIS (CIS benchmark compliance)
- Computer-WindowsUpdate-Workstations
- Computer-WindowsUpdate-Servers
- Computer-Software-Office365
- Computer-Software-AdobeReader
- Computer-Firewall-Baseline
- Computer-BitLocker-Laptops

**Users:**
- User-Folder-Redirection
- User-Drive-Mapping-All
- User-Desktop-Wallpaper
- User-Printer-Deployment
- User-IE-Settings
- User-Software-Restrictions

**Department-Specific:**
- User-Drive-Mapping-Finance
- User-Drive-Mapping-HR
- User-Software-Finance-Specific
- Computer-Finance-Additional-Security

### Enterprise GPO Structure

**Tiered Administration Model:**
```
Domain Level:
├── Tier-0-Admin-Baseline (for domain controllers, enforced)
├── Tier-1-Server-Baseline (for servers, enforced)
└── Tier-2-Workstation-Baseline (for workstations, enforced)
```

**Compliance and Security:**
- Security-CIS-Workstation-Level1
- Security-CIS-Workstation-Level2
- Security-CIS-Server-Level1
- Security-NIST-Baseline
- Security-PCI-Compliance
- Security-HIPAA-Requirements

**Software Deployment:**
- Software-Core-Suite (Office, Adobe, browsers)
- Software-Department-Finance
- Software-Department-Engineering
- Software-Optional-Requested

**Configuration Management:**
- Computer-WindowsUpdate-Ring1-Early
- Computer-WindowsUpdate-Ring2-Pilot
- Computer-WindowsUpdate-Ring3-Production
- Computer-WindowsUpdate-Ring4-Critical

## Creating and Configuring GPOs

### Open Group Policy Management Console

- Press **Win + R**, type `gpmc.msc`, press **Enter**
- Or from Server Manager: **Tools** → **Group Policy Management**

### Create a New GPO

**Method 1: GUI**

1. Open **Group Policy Management Console**
2. Expand **Forest** → **Domains** → **yourdomain.com**
3. Right-click **Group Policy Objects**
4. Select **New**
5. Enter GPO name (e.g., `Computer-Security-Baseline`)
6. Click **OK**

### Edit GPO Settings

1. Right-click the GPO
2. Select **Edit**
3. Configure settings in:
   - **Computer Configuration** → **Policies** → **Windows Settings** / **Administrative Templates**
   - **User Configuration** → **Policies** → **Windows Settings** / **Administrative Templates**

### Link GPO to OU

**Method 1: GUI**

1. In **Group Policy Management**, navigate to the target OU
2. Right-click the OU
3. Select **Link an Existing GPO**
4. Select your GPO
5. Click **OK**

### Security Filtering

Apply GPO to specific security groups instead of all users/computers in an OU:

**Example: Deploy software only to IT team**

1. Edit GPO: `Computer-Software-ITTools`
2. Go to **Delegation** tab
3. Remove **Authenticated Users**
4. Add **IT-Computers** group
5. Grant **Read** and **Apply Group Policy** permissions

### WMI Filtering

Apply GPO based on computer attributes (OS version, RAM, disk space):

**Example: Apply only to Windows 11 computers**

1. In **Group Policy Management**, right-click **WMI Filters**
2. Select **New**
3. Name: `Windows-11-Only`
4. Add query:
   ```sql
   SELECT * FROM Win32_OperatingSystem WHERE Caption LIKE "%Windows 11%"
   ```
5. Save the filter
6. Edit your GPO, go to **Scope** tab
7. Set **WMI Filtering** to your filter

**Common WMI Filters:**

```sql
-- Windows 10 only
SELECT * FROM Win32_OperatingSystem WHERE Caption LIKE "%Windows 10%"

-- Laptops only (has battery)
SELECT * FROM Win32_Battery

-- Computers with >8GB RAM
SELECT * FROM Win32_ComputerSystem WHERE TotalPhysicalMemory > 8589934592

-- Domain controllers
SELECT * FROM Win32_OperatingSystem WHERE ProductType = "2"
```

## Essential GPO Configurations for Homelab

### 1. Domain Password Policy

**Best Practice Password Settings:**

1. Create GPO: `Domain-Password-Policy`
2. Link to domain root (enforced)
3. Configure:

```
Computer Configuration → Policies → Windows Settings → Security Settings → Account Policies → Password Policy

Settings:
- Enforce password history: 24 passwords
- Maximum password age: 90 days (or 0 for homelab)
- Minimum password age: 1 day
- Minimum password length: 12 characters (or 14 for high security)
- Password must meet complexity requirements: Enabled
- Store passwords using reversible encryption: Disabled
```

### 2. Account Lockout Policy

Protect against brute force attacks:

```
Computer Configuration → Policies → Windows Settings → Security Settings → Account Policies → Account Lockout Policy

Settings:
- Account lockout duration: 30 minutes
- Account lockout threshold: 5 invalid logon attempts
- Reset account lockout counter after: 30 minutes
```

### 3. Windows Update Settings

**For Workstations:**

```
Computer Configuration → Policies → Administrative Templates → Windows Components → Windows Update

Settings:
- Configure Automatic Updates: Enabled
  - Option: 4 - Auto download and schedule the install
  - Scheduled install day: 0 - Every day
  - Scheduled install time: 03:00
- Enable client-side targeting: Enabled
  - Target group: Workstations
- No auto-restart with logged on users: Enabled
```

### 4. Folder Redirection

Redirect user folders to network share:

**Prerequisites:**
- Create network share: `\\FileServer\UserFolders$`
- Grant users permissions

**Configure GPO:**

```
User Configuration → Policies → Windows Settings → Folder Redirection → Documents

Settings:
- Setting: Basic
- Target folder location: Create a folder for each user under the root path
- Root Path: \\FileServer\UserFolders$\%USERNAME%\Documents
- Grant user exclusive rights: Enabled
- Move contents to new location: Enabled
```

### 5. Drive Mapping

Map network drives automatically:

```
User Configuration → Preferences → Windows Settings → Drive Maps

Action: Create
- Location: \\FileServer\SharedDrive
- Reconnect: Enabled
- Label as: Shared Drive (S:)
- Drive Letter: S:
- Hide/Show this drive: No change
- Hide/Show all drives: No change
```

**Item-Level Targeting** (optional):
- Only map if user is member of specific security group
- Only map if user is on a specific computer

### 6. Desktop Wallpaper

Set corporate wallpaper:

**Prerequisites:**
- Place wallpaper image on network share: `\\FileServer\Wallpapers\Corporate.jpg`
- Grant Domain Computers READ permission

**Configure GPO:**

```
User Configuration → Policies → Administrative Templates → Desktop → Desktop

Settings:
- Desktop Wallpaper: Enabled
  - Wallpaper Name: \\FileServer\Wallpapers\Corporate.jpg
  - Wallpaper Style: Fill
- Prevent changing desktop background: Enabled (locks it)
```

### 7. Windows Firewall Configuration

Enable and configure Windows Firewall:

```
Computer Configuration → Policies → Windows Settings → Security Settings → Windows Defender Firewall with Advanced Security

Settings:
- Domain Profile: ON
- Private Profile: ON
- Public Profile: ON

Inbound Rules:
- Block all by default
- Allow specific applications as needed

Outbound Rules:
- Allow all (default)
```

### 8. Disable USB Storage (Security)

Prevent users from using USB drives:

```
Computer Configuration → Policies → Administrative Templates → System → Removable Storage Access

Settings:
- All Removable Storage classes: Deny all access: Enabled
```

## Advanced GPO Concepts

### GPO Loopback Processing

Forces user GPO settings to be applied based on the computer location, not user location.

**Use Case:** Kiosk computers should have specific settings regardless of who logs in.

**Configure:**

```
Computer Configuration → Policies → Administrative Templates → System → Group Policy

Settings:
- Configure user Group Policy loopback processing mode: Enabled
  - Mode: Replace (computer user settings override user GPO)
```

### Starter GPOs

Templates for creating new GPOs with pre-configured settings.

**Create Starter GPO:**

1. In **Group Policy Management**, expand **Starter GPOs**
2. Right-click, select **New**
3. Configure baseline settings
4. When creating new GPOs, select this starter GPO as template

### GPO Backup and Restore

**Backup GPO:**

1. In **Group Policy Management**, right-click a GPO
2. Select **Back Up**
3. Choose backup location
4. Add description
5. Click **Back Up**

**Backup All GPOs:**

1. Right-click **Group Policy Objects** container
2. Select **Back Up All**
3. Choose backup location
4. Click **Back Up**

**Restore GPO:**

1. Right-click a GPO
2. Select **Restore from Backup**
3. Browse to backup location
4. Select backup to restore
5. Click **OK**

### GPO Reporting

**Generate HTML Report for Single GPO:**

1. In **Group Policy Management**, right-click a GPO
2. Select **Save Report**
3. Choose HTML format
4. Save to desired location

**Group Policy Results (What Applies to Specific User/Computer):**

Use `gpresult` to see which policies are applied:

```cmd
:: Generate HTML report for current user/computer
:: IMPORTANT: Run as Administrator to include computer settings
gpresult /h C:\Temp\GPResult.html

:: Show summary in console
gpresult /r

:: Scope to user settings only
gpresult /scope:user /r

:: Scope to computer settings only (requires admin)
gpresult /scope:computer /r
```

> **Important:**  
> Always run `gpresult` **as Administrator** when generating reports. If run as a standard user, the report will only include user settings and will be missing all computer configuration details.
{: .prompt-warning }

## Troubleshooting Group Policy

### Common Issues and Solutions

**Issue 1: Group Policy Not Applying**

**Symptoms:** Settings don't apply, gpresult shows GPO not applied

**Solutions:**

1. Force update with `gpupdate /force` (see command reference below)
2. In GPMC, check the GPO:
   - **Status** tab - ensure not disabled
   - **Scope** tab - verify security filtering
   - **Details** tab - confirm GPO enabled
3. Verify replication if multi-DC environment
4. Check Event Viewer for errors (Event IDs 1030, 1058)

**Issue 2: Slow Login/Startup**

**Symptoms:** Long wait during "Applying Group Policy" or "Applying Computer Settings"

**Solutions:**

1. Check Event Viewer for slow GPOs (Event IDs 8001, 8004)
2. Disable unused sections: Right-click GPO → **GPO Status** → Disable Computer or User settings if empty
3. Remove unnecessary GPO links from OUs
4. Consider reducing number of linked GPOs (combine related settings)

**Issue 3: Conflicting Policies**

**Symptoms:** Setting keeps changing, unexpected behavior

**Solutions:**

1. Generate gpresult report: `gpresult /h C:\Temp\Report.html` (as Administrator)
2. Review report for:
   - Processing order (LSDOU)
   - Winning settings
   - Enforced or blocked GPOs
3. Check for Enforced links or Block Inheritance
4. Verify GPO link order (lower number = higher priority)

**Issue 4: GPO Settings Reverted**

**Symptoms:** Apply settings via GPO, they work initially but revert

**Causes:**
- Higher-priority GPO overriding
- User manually changing (GPO should re-apply at next update)
- Conflicting local policy

**Solutions:**

1. Use `gpresult /scope:computer /r` or `gpresult /scope:user /r`
2. Review inheritance in GPMC
3. Check for conflicting GPOs at parent OUs

### Essential Troubleshooting Commands

```cmd
:: Force immediate policy update
gpupdate /force
gpupdate /target:computer /force  # Computer policies only
gpupdate /target:user /force      # User policies only
gpupdate /force /wait:-1          # Processing getting caught/hung up

:: Generate diagnostic report (ALWAYS run as Administrator)
gpresult /h C:\Temp\GPResult.html  # Full HTML report
gpresult /r                         # Console summary
gpresult /scope:computer /r         # Computer policies only
gpresult /scope:user /r             # User policies only
```

> **Pro Tip:**  
> Always run `gpresult /h` as Administrator for complete diagnostics. Standard user reports omit all computer configuration details.
{: .prompt-tip }

## Security Baselines: CIS Benchmarks

### What are CIS Benchmarks?

**CIS (Center for Internet Security) Benchmarks** are industry-standard security configurations widely used for compliance. They provide two levels:

- **Level 1**: Baseline security with minimal functionality impact
- **Level 2**: Enhanced security for sensitive environments (may affect compatibility)

### Using CIS in Your Environment

**Free Options:**
- **CIS Benchmark PDFs** (free with registration) - Manual implementation guidance
- **Microsoft Security Baselines** - Free GPO downloads from Microsoft
- **DISA STIGs** - DoD security configurations (very restrictive)

**Paid Option (CIS SecureSuite Membership):**
- **CIS Build Kits** - Pre-configured GPOs ready to import
- Saves hundreds of hours but creates monolithic "everything GPOs"
- Widely used in enterprise for compliance requirements

### Challenge: Overriding CIS Build Kits

CIS Build Kits are monolithic (all settings in one GPO), which conflicts with granular design principles. To override specific settings without editing the CIS GPO:

**Create Higher-Priority Override GPO:**

1. Create new GPO: `Computer-CIS-Overrides`
2. Link both GPOs to target OU:
   - `Computer-CIS-Overrides` with Link Order 1 (higher priority)
   - `Security-CIS-Level1` with Link Order 2 (lower priority)
3. In the override GPO, configure only the specific settings you need to change
4. Add comments to each overridden setting explaining why

Configure only the specific settings you need to override in the override GPO. This preserves the CIS baseline while allowing necessary exceptions.

> **Recommendation:**  
> Start with **Microsoft Security Baselines** (free) for homelab learning. For enterprise with compliance requirements, CIS Build Kits provide audit-ready configurations. Always test in isolated OUs first - both Level 1 and Level 2 can break applications.
{: .prompt-tip }

**Resources:**
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) - Free PDFs
- [Microsoft Security Compliance Toolkit](https://www.microsoft.com/en-us/download/details.aspx?id=55319) - Free GPO downloads
- [CIS SecureSuite](https://www.cisecurity.org/cis-securesuite) - Paid membership for Build Kits

## Best Practices Summary

### DO:

- **Use descriptive naming conventions** (`Computer-Security-Baseline`, not `GPO1`)
- **One purpose per GPO** (granular design)
- **Test in isolated OU first** before production
- **Disable unused sections** (User or Computer config)
- **Document every GPO** (add comments describing purpose)
- **Back up GPOs regularly** (scheduled backups)
- **Use security filtering** when appropriate
- **Keep GPO structure simple** (avoid excessive complexity)
- **Review GPO links quarterly** (remove unused)
- **Use GPO comments** to track changes

### DON'T:

- **Don't use Block Inheritance** unless absolutely necessary
- **Don't overuse Enforced** (makes troubleshooting hard)
- **Don't create monolithic GPOs** (all settings in one GPO, except CIS Build Kits for compliance)
- **Don't link dozens of GPOs to one OU** (slow processing)
- **Don't modify Default Domain Policy** (except password settings)
- **Don't modify Default Domain Controllers Policy** (except audit settings)
- **Don't deploy untested GPOs** to production
- **Don't mix user and computer settings** in same GPO (unless necessary)
- **Don't forget to backup** before major changes

## Summary

You've learned how to design, implement, and troubleshoot Group Policy in Active Directory.

### What You've Accomplished

- [x] Understood Group Policy fundamentals (LSDOU, inheritance)
- [x] Learned GPO design principles (granular, purpose-based)
- [x] Created recommended GPO structures for various scales
- [x] Configured essential GPOs (passwords, Windows Update, folder redirection)
- [x] Implemented security filtering and WMI filtering
- [x] Mastered GPO backup, restore, and reporting
- [x] Troubleshooted common Group Policy issues
- [x] Learned best practices for maintainable GPO infrastructure

### Homelab Learning Outcomes

By completing this guide, you've gained:
- **Enterprise policy management**: Skills used in organizations managing thousands of systems
- **Automation mindset**: Configure once, apply everywhere
- **Security awareness**: Enforcing baselines and compliance
- **Troubleshooting expertise**: Diagnosing and resolving policy conflicts
- **Real-world experience**: Directly applicable to production environments

### What's Next

Your Active Directory infrastructure is now complete with domain controllers, organized OUs, and automated policy management. Consider these next steps:

**Infrastructure Enhancements:**
- **Certificate Services**: Set up Enterprise CA for internal certificates (already covered in our [Enterprise CA guide]({% post_url 2025-12-24-How-to-Configure-Enterprise-CA-and-Deploy-LDAPS %}))
- **DHCP Server**: Centralized IP address management
- **DNS Zones**: Advanced DNS configurations
- **DFS Namespaces**: Unified file share structure
- **Active Directory Federation Services (ADFS)**: SSO for web applications

**Security Hardening:**
- Implement Microsoft Security Baselines
- Configure Advanced Audit Policies
- Deploy LAPS (Local Administrator Password Solution)
- Set up Privileged Access Workstations (PAWs)
- Enable Windows Defender Application Control

**Monitoring and Maintenance:**
- Set up AD replication monitoring
- Configure GPO change auditing
- Implement automated health checks
- Create disaster recovery procedures
- Document everything for future reference

## Resources

**Group Policy:**
- [Group Policy Overview](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/hh831791(v=ws.11))
- [Group Policy Settings Reference](https://learn.microsoft.com/en-us/windows/client-management/mdm/policy-configuration-service-provider)
- [Group Policy PowerShell Module](https://learn.microsoft.com/en-us/powershell/module/grouppolicy/)
- [Troubleshooting Group Policy](https://learn.microsoft.com/en-us/troubleshoot/windows-server/group-policy/applying-group-policy-troubleshooting-guidance)
- [GPResult Command Reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult)

**Security Baselines:**
- [Microsoft Security Baselines](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-security-baselines)
- [Microsoft Security Compliance Toolkit](https://www.microsoft.com/en-us/download/details.aspx?id=55319) - Free GPO downloads
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks) - Free benchmark PDFs (registration required)
- [CIS SecureSuite Membership](https://www.cisecurity.org/cis-securesuite) - Paid membership for Build Kits and tools
- [CIS Controls](https://www.cisecurity.org/controls) - High-level security framework
- [CIS Hardened Images](https://www.cisecurity.org/cis-hardened-images) - Pre-configured VMs
- [DISA STIGs](https://public.cyber.mil/stigs/) - Department of Defense security guides (free)
