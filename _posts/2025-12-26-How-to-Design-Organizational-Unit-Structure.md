---
layout: post
title: "How to Design Organizational Unit Structure"
date: 2025-12-26 08:00:00 -0500
categories: [Windows Server, Active Directory]
tags: [homelab, windows-server, active-directory, organizational-units, ou-structure, sysadmin, best-practices]
---

## Introduction

**Your Journey So Far:**

> **Important:**  
> This guide assumes you've completed the Domain Controller series (Parts 1-4). If you haven't set up your domain controllers yet, **start there first**:
> - [Part 1: Windows Server Installation]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt1 %})
> - [Part 2: First Domain Controller Setup]({% post_url 2025-05-10-How-to-Setup-Domain-Controllers-Pt2 %})
> - [Part 3: Secondary DC for Redundancy]({% post_url 2025-12-23-How-to-Setup-Domain-Controllers-Pt3 %})
{: .prompt-warning }

You've built a solid Active Directory foundation:
- [x] Installed and configured Windows Server
- [x] Created your first domain controller
- [x] Added redundancy with a secondary DC
- [x] (Optional) Deployed an advanced RODC on Server Core

Now comes one of the most critical design decisions in your Active Directory deployment: **Organizational Unit (OU) structure**.

**Why OU Structure Matters:**

Think of your Active Directory domain as a city. Without proper organization, it's chaos - users, computers, and groups scattered randomly with no logical structure. OUs are like city districts, neighborhoods, and streets that bring order and enable efficient management.

A well-designed OU structure:
- **Simplifies Management**: Find and manage objects quickly
- **Enables Group Policy**: Apply settings to specific groups of objects
- **Delegates Administration**: Allow team members to manage specific areas
- **Scales Gracefully**: Grows with your organization without redesign
- **Reduces Errors**: Clear organization prevents mistakes

**The Cost of Poor Design:**

Many organizations deploy Active Directory with minimal planning, creating OUs as needed. This leads to:
- Inconsistent naming conventions
- Duplicate or redundant OUs
- Complex Group Policy chains
- Difficulty finding objects
- **Expensive reorganization projects** (enterprise OU redesigns can cost millions)

> **Critical Warning:**  
> Unlike domain names (which are nearly impossible to change), OUs CAN be reorganized - but it's disruptive. Plan carefully now to avoid painful migrations later. Every object move can trigger Group Policy reapplication and potential service disruptions.
{: .prompt-danger }

> **Prerequisites:**  
> - A functioning Active Directory domain with at least one domain controller
> - Domain Administrator credentials
> - Understanding of your organization's structure (even if it's just you in a homelab)
> - Familiarity with Active Directory basics (covered in the DC series)
{: .prompt-info }

## Understanding Organizational Units

### What Are OUs?

Organizational Units are containers within Active Directory that:
- **Hold objects**: Users, computers, groups, and other OUs (nested)
- **Apply Group Policy**: GPOs link to OUs to configure settings
- **Enable delegation**: Grant specific administrators control over OU contents
- **Organize logically**: Reflect your business structure, not network topology

### OUs vs. Groups vs. Containers

**Organizational Units (OUs):**
- Containers for organizing AD objects
- Can have Group Policy applied
- Support delegation of administration
- Can be nested (OUs within OUs)
- **Used for**: Management and policy application

**Security Groups:**
- Collections of users, computers, or other groups
- Used for permissions (file shares, applications)
- Can be used for GPO security filtering
- Not a structural element
- **Used for**: Access control and permissions

**Default Containers (Users, Computers, Builtin):**
- Pre-created by Active Directory
- **Cannot** have Group Policy applied
- **Cannot** be delegated
- Should be avoided for daily use
- **Used for**: Default object creation (should be changed)

> **Common Mistake:**  
> Many beginners leave users in the default "Users" container and computers in "Computers" container. These are NOT OUs and don't support Group Policy. Always move objects to proper OUs.
{: .prompt-warning }

## OU Design Principles

### 1. Design for Group Policy, Not Org Chart

**Wrong Approach: Mirroring Org Chart**
```
Domain
└── Human Resources
    ├── HR Director
    ├── HR Managers
    └── HR Staff
└── IT Department
    ├── IT Director
    └── IT Staff
```

**Problem**: What about their computers? Servers? Groups? Do you create separate "HR Computers" and "HR Servers" OUs? This becomes messy quickly.

**Right Approach: Object-Type Based**
```
Domain
├── Users
│   ├── HR
│   ├── IT
│   └── Sales
├── Computers
│   ├── Workstations
│   ├── Laptops
│   └── Kiosks
├── Servers
│   ├── Application Servers
│   ├── File Servers
│   └── Web Servers
└── Groups
    ├── Security Groups
    └── Distribution Groups
```

**Why This Works**: Each object type has different Group Policy needs. Workstations need desktop policies, servers need server hardening, users need login scripts.

### 2. Plan for Delegation

Consider who will manage what:
- Help desk resetting passwords for specific departments
- Department managers managing their own user accounts
- Server team managing servers but not workstations
- Security team auditing specific OUs

**Delegation-Friendly Structure:**
```
Domain
├── Corporate
│   ├── Users
│   │   ├── IT (IT team can delegate here)
│   │   ├── HR (HR team can delegate here)
│   │   └── Finance (Finance team can delegate here)
│   └── Computers
│       └── Workstations
└── Servers
    └── Production (Server team has full control)
```

### 3. Keep It Simple (KISS Principle)

**Bad Example (Too Complex):**
```
Domain
└── North America
    └── United States
        └── California
            └── San Francisco
                └── Office Building A
                    └── 3rd Floor
                        └── West Wing
                            └── HR Department
                                └── Users
```

**7 levels deep!** This is insane for a 20-person company.

**Good Example (Appropriate Depth):**
```
Domain
└── Corporate
    ├── Users
    │   └── HR
    └── Computers
        └── Workstations
```

**Rule of Thumb**: Stay under 5 levels of nesting for most organizations. Homelab? 2-3 levels is plenty.

### 4. Consider Your Scale

**Homelab (1-50 objects):**
```
Domain
├── Users
├── Computers
├── Servers
└── Groups
```
Simple, flat, easy to navigate.

**Small Business (50-500 objects):**
```
Domain
├── Users
│   ├── Employees
│   └── Contractors
├── Computers
│   ├── Workstations
│   └── Laptops
├── Servers
└── Groups
```

**Medium Enterprise (500-5000 objects):**
```
Domain
├── Corporate
│   ├── Users
│   │   ├── IT
│   │   ├── HR
│   │   ├── Finance
│   │   └── Sales
│   └── Computers
│       ├── Workstations
│       │   ├── Windows 10
│       │   └── Windows 11
│       └── Laptops
├── Servers
│   ├── Production
│   ├── Development
│   └── Test
└── Groups
    ├── Security
    └── Distribution
```

**Large Enterprise (5000+ objects):**
- May use multiple domains
- Geographic OUs (Americas, EMEA, APAC)
- Site-based OUs for distributed offices
- Separate OUs per application or service
- Dedicated OUs for privileged accounts

### Keep the Domain Root Clean (Best Practice)

**Important Design Decision:**

Many organizations create a top-level OU named after the domain (or a generic name like "Corporate" or "Company") to keep the domain root clean. This approach has several advantages:

**Why Use a Top-Level Container OU:**

1. **Cleaner Domain Root**: Default containers (Users, Computers, Builtin, Domain Controllers) stay at root, but all custom objects go in one place
2. **Easier GPO Management**: Apply broad policies at the top-level OU, which inherit down
3. **Clear Separation**: Immediately distinguishes between Microsoft defaults and your custom structure
4. **Migration-Friendly**: Makes it easier to migrate or reorganize later
5. **Enterprise Standard**: Many large organizations follow this pattern

**Structure Comparison:**

**Without Top-Level OU (Mixed at Root):**
```
yourdomain.com
├── Builtin (default)
├── Computers (default)
├── Domain Controllers (default)
├── ForeignSecurityPrincipals (default)
├── Users (default)
├── Admins (your custom OU)
├── Users (your custom OU) ← Naming conflict with default!
├── Computers (your custom OU) ← Naming conflict with default!
└── Groups (your custom OU)
```
**Problem:** Name conflicts with defaults, cluttered root, hard to distinguish custom from default.

**With Top-Level OU (Recommended):**
```
yourdomain.com
├── Builtin (default)
├── Computers (default - should be empty after redirection)
├── Domain Controllers (default)
├── ForeignSecurityPrincipals (default)
├── Users (default - should be empty after redirection)
└── YOURDOMAIN (or "Corporate" or "Company")
    ├── Admins
    ├── Users
    ├── Computers
    ├── Servers
    └── Groups
```
**Benefits:** Clean separation, no name conflicts, clear structure, easier to manage.

**Naming the Top-Level OU:**

- **Domain Name**: `CONTOSO` (for contoso.com) - clearly identifies your organization
- **Generic**: `Corporate`, `Company`, `Enterprise` - works if you prefer not to use domain name
- **Abbreviation**: `CORP`, `ORG` - shorter, common in large enterprises

**When to Skip the Top-Level OU:**

- Very small homelab (< 10 objects) where simplicity is paramount
- Single-purpose domain (dedicated to one application)
- Personal preference if you're the only admin and prefer flat structure

> **Recommendation:**  
> For homelab learning and anything beyond basic testing, use a top-level OU. It teaches the enterprise standard and makes your structure more maintainable as you grow.
{: .prompt-tip }

## Recommended OU Structures

### Homelab Structure (Beginner-Friendly)

Perfect for learning and small environments (1-50 objects):

```
yourdomain.com
├── Builtin (default)
├── Computers (default - leave empty)
├── Domain Controllers (default - leave as-is)
├── Users (default - leave empty)
└── YOURDOMAIN (your top-level OU)
    ├── Admins
    │   ├── Domain Admins (users)
    │   └── Service Accounts
    ├── Users
    │   ├── Standard Users
    │   └── Test Users
    ├── Computers
    │   ├── Workstations
    │   └── Laptops
    ├── Servers
    │   ├── File Servers
    │   ├── Application Servers
    │   └── Lab Servers
    └── Groups
        ├── Security Groups
        └── Distribution Lists
```

**Why This Works:**
- [x] Clean domain root with clear separation
- [x] Clear separation of object types within top-level OU
- [x] Admins segregated from regular users (security best practice)
- [x] Room to grow without redesign
- [x] Easy to apply different GPOs to each category
- [x] Beginner-friendly and intuitive
- [x] Follows enterprise standards

### Small Business Structure

For businesses with 50-500 employees:

```
contoso.com
├── Builtin (default)
├── Computers (default - leave empty)
├── Domain Controllers (default - leave as-is)
├── Users (default - leave empty)
└── CONTOSO (your top-level OU)
    ├── Admin
    │   ├── Privileged Users
    │   ├── Service Accounts
    │   └── Tier 0 Admins
    ├── Users
    │   ├── Employees
    │   │   ├── IT
    │   │   ├── HR
    │   │   ├── Finance
    │   │   ├── Sales
    │   │   └── Operations
    │   └── Contractors
    ├── Computers
    │   ├── Desktops
    │   │   ├── Windows 10
    │   │   └── Windows 11
    │   ├── Laptops
    │   └── Kiosks
    ├── Servers
    │   ├── File Servers
    │   ├── Application Servers
    │   ├── Web Servers
    │   └── Database Servers
    ├── Groups
    │   ├── Security Groups
    │   └── Distribution Groups
    └── Resources
        ├── Printers
        └── Shared Devices
```

### Enterprise Structure (Multi-Site)

For large organizations with multiple offices:

```
corp.contoso.com
├── Builtin (default)
├── Computers (default - leave empty)
├── Domain Controllers (default - leave as-is)
├── Users (default - leave empty)
└── CORP (your top-level OU)
    ├── Admin
    │   ├── Tier 0 (Domain/Enterprise Admins)
    │   ├── Tier 1 (Server Admins)
    │   ├── Tier 2 (Workstation Admins)
    │   └── Service Accounts
    │       ├── SQL Service Accounts
    │       ├── IIS Service Accounts
    │       └── Backup Service Accounts
    ├── Locations
    │   ├── HQ-NewYork
    │   │   ├── Users
    │   │   ├── Computers
    │   │   └── Resources
    │   ├── Branch-Chicago
    │   │   ├── Users
    │   │   ├── Computers
    │   │   └── Resources
    │   └── Branch-LosAngeles
    │       ├── Users
    │       ├── Computers
    │       └── Resources
    ├── Servers
    │   ├── Production
    │   │   ├── SQL Servers
    │   │   ├── Web Servers
    │   │   └── File Servers
    │   ├── Development
    │   └── Test
    ├── Groups
    │   ├── Security Groups
    │   │   ├── Access Groups
    │   │   ├── Role Groups
    │   │   └── Admin Groups
    │   └── Distribution Groups
    └── Disabled Objects
        ├── Disabled Users
        └── Disabled Computers
```

## Creating Your OU Structure

### Planning Phase

Before creating a single OU, document your design:

**1. List Your Object Categories:**
- How many users? (current and 2-year projection)
- How many computers? (workstations vs. laptops vs. tablets)
- How many servers?
- Any special object types? (kiosks, POS systems, printers)

**2. Identify Policy Needs:**
- Do workstations and laptops need different policies?
- Do different departments need different user policies?
- Do you have compliance requirements (SOX, HIPAA, PCI)?

**3. Plan Delegation:**
- Who needs to manage what?
- Help desk password resets?
- Department managers creating accounts?

**4. Sketch the Structure:**
- Draw it on paper or use a tool like draw.io
- Get feedback from stakeholders
- Test in a lab environment first

### Creating OUs via GUI

**Method 1: Active Directory Users and Computers (ADUC)**

1. Press **Win + R**, type `dsa.msc`, press **Enter**
2. Right-click your domain name
3. Select **New** → **Organizational Unit**
4. Enter OU name (e.g., `Users`)
5. **Uncheck** "Protect container from accidental deletion" (optional, for homelab)
6. Click **OK**

Repeat for each top-level OU, then create nested OUs inside them.

**Method 2: Active Directory Administrative Center (ADAC)**

1. Press **Win + R**, type `dsac.msc`, press **Enter**
2. Navigate to your domain
3. In the **Tasks** pane, click **New** → **Organizational Unit**
4. Enter OU name and description
5. Click **OK**

> **GUI Tip:**  
> Right-click an OU and select **Delegate Control** to grant specific users administrative rights over that OU and its contents. Common for help desk teams.
{: .prompt-tip }

### Creating OUs via PowerShell

**Single OU:**

```powershell
# Import Active Directory module
Import-Module ActiveDirectory

# Create top-level OU
New-ADOrganizationalUnit -Name "Users" -Path "DC=yourdomain,DC=com" -ProtectedFromAccidentalDeletion $true

# Create nested OU
New-ADOrganizationalUnit -Name "IT" -Path "OU=Users,DC=yourdomain,DC=com" -ProtectedFromAccidentalDeletion $true
```

**Complete Homelab Structure (Automated):**

```powershell
# Import AD module
Import-Module ActiveDirectory

# Define domain DN
$DomainDN = (Get-ADDomain).DistinguishedName

# Define OU structure
$OUStructure = @{
    "Admins" = @("Domain Admins", "Service Accounts")
    "Users" = @("Standard Users", "Test Users")
    "Computers" = @("Workstations", "Laptops")
    "Servers" = @("File Servers", "Application Servers", "Lab Servers")
    "Groups" = @("Security Groups", "Distribution Lists")
}

# Create top-level OUs
foreach ($TopOU in $OUStructure.Keys) {
    try {
        New-ADOrganizationalUnit -Name $TopOU -Path $DomainDN -ProtectedFromAccidentalDeletion $true -ErrorAction Stop
        Write-Host "Created OU: $TopOU" -ForegroundColor Green
    }
    catch {
        Write-Host "OU $TopOU already exists or error: $_" -ForegroundColor Yellow
    }
}

# Create nested OUs
foreach ($TopOU in $OUStructure.Keys) {
    $TopOUPath = "OU=$TopOU,$DomainDN"
    foreach ($SubOU in $OUStructure[$TopOU]) {
        try {
            New-ADOrganizationalUnit -Name $SubOU -Path $TopOUPath -ProtectedFromAccidentalDeletion $true -ErrorAction Stop
            Write-Host "  Created nested OU: $TopOU\$SubOU" -ForegroundColor Cyan
        }
        catch {
            Write-Host "  Nested OU $SubOU already exists or error: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nOU structure creation complete!" -ForegroundColor Green
```

**Verify OU Creation:**

```powershell
# List all OUs
Get-ADOrganizationalUnit -Filter * | Select-Object Name, DistinguishedName | Sort-Object Name

# List OUs in tree format
Get-ADOrganizationalUnit -Filter * | 
    Select-Object @{Name="OUPath";Expression={$_.DistinguishedName -replace "DC=\w+,DC=\w+",""}} | 
    Sort-Object OUPath
```

## Moving Objects to OUs

Once your OU structure is created, move objects from default containers to appropriate OUs.

### Move Users

**GUI Method:**

1. Open **Active Directory Users and Computers**
2. Navigate to **Users** container (default location)
3. Right-click a user → **Move**
4. Select destination OU (e.g., `OU=Standard Users,OU=Users,DC=yourdomain,DC=com`)
5. Click **OK**

**PowerShell Method:**

```powershell
# Move single user
Get-ADUser "jdoe" | Move-ADObject -TargetPath "OU=Standard Users,OU=Users,DC=yourdomain,DC=com"

# Move multiple users
Get-ADUser -Filter {Department -eq "IT"} | 
    Move-ADObject -TargetPath "OU=IT,OU=Users,DC=yourdomain,DC=com"

# Move all users from default Users container
Get-ADUser -Filter * -SearchBase "CN=Users,DC=yourdomain,DC=com" -SearchScope OneLevel | 
    Where-Object {$_.Name -ne "Administrator" -and $_.Name -ne "Guest" -and $_.Name -ne "krbtgt"} |
    Move-ADObject -TargetPath "OU=Standard Users,OU=Users,DC=yourdomain,DC=com"
```

### Move Computers

**GUI Method:**

1. Open **Active Directory Users and Computers**
2. Navigate to **Computers** container
3. Right-click a computer → **Move**
4. Select destination OU
5. Click **OK**

**PowerShell Method:**

```powershell
# Move single computer
Get-ADComputer "WS001" | Move-ADObject -TargetPath "OU=Workstations,OU=Computers,DC=yourdomain,DC=com"

# Move all computers from default Computers container
Get-ADComputer -Filter * -SearchBase "CN=Computers,DC=yourdomain,DC=com" -SearchScope OneLevel |
    Move-ADObject -TargetPath "OU=Workstations,OU=Computers,DC=yourdomain,DC=com"
```

### Redirect Default Computer Creation

By default, new computers join the "Computers" container. Change this to your desired OU:

```powershell
# Set default computer container
redircmp "OU=Workstations,OU=Computers,DC=yourdomain,DC=com"

# Verify the change
Get-ADObject "CN=Computers,DC=yourdomain,DC=com" -Properties wellKnownObjects
```

### Redirect Default User Creation

Change where new users are created by default:

```powershell
# Set default user container
redirusr "OU=Standard Users,OU=Users,DC=yourdomain,DC=com"
```

## Delegation of Control

Delegation allows you to grant specific administrative permissions without making users Domain Admins.

### Common Delegation Scenarios

**Scenario 1: Help Desk Password Resets**

Allow help desk to reset passwords for standard users:

1. Right-click **OU=Standard Users**
2. Select **Delegate Control**
3. Click **Next**
4. Click **Add**, select **HelpDesk** group
5. Click **Next**
6. Select **Reset user passwords and force password change at next logon**
7. Click **Next**, then **Finish**

**PowerShell Delegation:**

```powershell
# Grant help desk password reset permissions
$OU = "OU=Standard Users,OU=Users,DC=yourdomain,DC=com"
$Group = "HelpDesk"

# Get the OU object
$OUObject = Get-ADOrganizationalUnit -Identity $OU

# Get the help desk group SID
$GroupSID = (Get-ADGroup $Group).SID

# Create access rule for password reset
$ACL = Get-ACL "AD:\$OU"
$Identity = [System.Security.Principal.IdentityReference] $GroupSID
$ADRight = [System.DirectoryServices.ActiveDirectoryRights]::ExtendedRight
$Type = [System.Security.AccessControl.AccessControlType]::Allow
$InheritanceType = [System.DirectoryServices.ActiveDirectorySecurityInheritance]::All
$GUID = [GUID]"00299570-246d-11d0-a768-00aa006e0529" # Reset Password GUID

$ACE = New-Object System.DirectoryServices.ActiveDirectoryAccessRule($Identity, $ADRight, $Type, $GUID, $InheritanceType)
$ACL.AddAccessRule($ACE)
Set-ACL -Path "AD:\$OU" -AclObject $ACL

Write-Host "Password reset permissions granted to $Group on $OU" -ForegroundColor Green
```

**Scenario 2: Department Manager User Management**

Allow HR manager to create/delete users in HR OU:

1. Right-click **OU=HR**
2. Select **Delegate Control**
3. Add HR Manager user
4. Select **Create, delete, and manage user accounts**
5. Finish wizard

**Scenario 3: Server Team Server Management**

Grant server team full control over Servers OU:

```powershell
$OU = "OU=Servers,DC=yourdomain,DC=com"
$Group = "ServerAdmins"

$ACL = Get-ACL "AD:\$OU"
$Identity = (Get-ADGroup $Group).SID
$ADRight = [System.DirectoryServices.ActiveDirectoryRights]::GenericAll
$Type = [System.Security.AccessControl.AccessControlType]::Allow
$InheritanceType = [System.DirectoryServices.ActiveDirectorySecurityInheritance]::All

$ACE = New-Object System.DirectoryServices.ActiveDirectoryAccessRule($Identity, $ADRight, $Type, $InheritanceType)
$ACL.AddAccessRule($ACE)
Set-ACL -Path "AD:\$OU" -AclObject $ACL
```

## Common Mistakes to Avoid

### 1. Too Many Levels (Over-Engineering)

**Bad:**
```
Domain → Locations → Countries → States → Cities → Buildings → Floors → Departments → Users
```
**8 levels!** This is insane and makes management a nightmare.

**Good:**
```
Domain → Users → Department
```
**2-3 levels** is sufficient for most organizations.

### 2. Mixing Object Types in Same OU

**Bad:**
```
IT Department
├── IT-User-1
├── IT-User-2
├── IT-Workstation-1
├── IT-Server-1
└── IT-Printer-1
```

**Problem**: How do you apply Group Policy? Users need desktop wallpaper policy, computers need Windows Update policy. They have completely different needs.

**Good:**
```
Users
└── IT
    ├── IT-User-1
    └── IT-User-2
Computers
└── Workstations
    └── IT-Workstation-1
Servers
└── IT-Server-1
```

### 3. Leaving Objects in Default Containers

**Problem**: Default "Users" and "Computers" containers don't support Group Policy!

**Solution**: Move everything to proper OUs immediately after creation.

### 4. Not Protecting Admin Accounts

**Bad:**
```
Users
├── Standard User 1
├── Standard User 2
└── Domain Admin User
```

**Problem**: If you apply a restrictive GPO to "Users" OU, it affects your admin account too.

**Good:**
```
Admins
└── Domain Admin User (separate OU, separate GPOs)
Users
├── Standard User 1
└── Standard User 2
```

### 5. Forgetting About Disabled Objects

**Problem**: Disabled users/computers mixed with active objects makes reports confusing.

**Solution**: Create dedicated OUs for disabled objects:

```powershell
New-ADOrganizationalUnit -Name "Disabled Objects" -Path $DomainDN
New-ADOrganizationalUnit -Name "Disabled Users" -Path "OU=Disabled Objects,$DomainDN"
New-ADOrganizationalUnit -Name "Disabled Computers" -Path "OU=Disabled Objects,$DomainDN"

# Block inheritance on disabled OUs (no GPOs apply)
Set-GPInheritance -Target "OU=Disabled Objects,DC=yourdomain,DC=com" -IsBlocked Yes
```

### 6. Poor Naming Conventions

**Bad Examples:**
- `OU=Bob's Team`
- `OU=Stuff`
- `OU=Misc Users`
- `OU=New Folder (3)`

**Good Examples:**
- `OU=IT-Users`
- `OU=Marketing-Workstations`
- `OU=Finance-Servers`
- `OU=Contractors-External`

**Naming Best Practices:**
- Use clear, descriptive names
- Consistent format across all OUs
- No special characters or spaces (use hyphens)
- Document abbreviations

## Reorganizing Existing OUs

If you inherited a messy OU structure or outgrew your design:

### Assessment Phase

```powershell
# Analyze current OU structure
Get-ADOrganizationalUnit -Filter * | 
    Select-Object Name, DistinguishedName |
    Out-File C:\Temp\CurrentOUStructure.txt

# Count objects in each OU
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
    $OU = $_.DistinguishedName
    $UserCount = (Get-ADUser -Filter * -SearchBase $OU -SearchScope OneLevel).Count
    $ComputerCount = (Get-ADComputer -Filter * -SearchBase $OU -SearchScope OneLevel).Count
    
    [PSCustomObject]@{
        OU = $OU
        Users = $UserCount
        Computers = $ComputerCount
    }
} | Export-Csv C:\Temp\OU-ObjectCounts.csv -NoTypeInformation
```

### Migration Planning

1. **Document Current GPO Links**:
```powershell
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
    Get-GPInheritance -Target $_.DistinguishedName | 
        Select-Object Path, GpoLinks
} | Export-Csv C:\Temp\GPO-Links-Backup.csv -NoTypeInformation
```

2. **Create New OU Structure** (in parallel, don't delete old one yet)

3. **Test GPO Application** on new OUs with test objects

4. **Migrate Objects Gradually** (by department, by object type)

5. **Monitor for Issues** (login problems, policy application failures)

6. **Clean Up Old OUs** after confirming everything works

### Migration Script Example

```powershell
# Safe migration with confirmation
$SourceOU = "CN=Users,DC=yourdomain,DC=com"
$DestinationOU = "OU=Standard Users,OU=Users,DC=yourdomain,DC=com"

# Get users to migrate (excluding built-in accounts)
$UsersToMove = Get-ADUser -Filter * -SearchBase $SourceOU -SearchScope OneLevel |
    Where-Object {$_.Name -notin @("Administrator", "Guest", "krbtgt")}

# Display preview
Write-Host "The following users will be moved:" -ForegroundColor Yellow
$UsersToMove | Select-Object Name, SamAccountName

# Confirm
$Confirm = Read-Host "Proceed with migration? (Y/N)"
if ($Confirm -eq 'Y') {
    foreach ($User in $UsersToMove) {
        try {
            Move-ADObject -Identity $User -TargetPath $DestinationOU
            Write-Host "Moved: $($User.Name)" -ForegroundColor Green
        }
        catch {
            Write-Host "Error moving $($User.Name): $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
}
```

## Verification and Maintenance

### Verify OU Structure

```powershell
# List all OUs with depth indicator
Get-ADOrganizationalUnit -Filter * | 
    Select-Object @{
        Name="Depth"
        Expression={($_.DistinguishedName -split "OU=").Count - 1}
    }, Name, DistinguishedName |
    Sort-Object Depth, Name

# Find OUs with no objects (possibly unnecessary)
Get-ADOrganizationalUnit -Filter * | ForEach-Object {
    $OU = $_.DistinguishedName
    $ObjectCount = (Get-ADObject -Filter * -SearchBase $OU -SearchScope OneLevel).Count
    
    if ($ObjectCount -eq 0) {
        [PSCustomObject]@{
            OU = $OU
            ObjectCount = $ObjectCount
            Status = "Empty"
        }
    }
} | Format-Table -AutoSize
```

### Regular Maintenance Tasks

**Monthly:**
- Review disabled users/computers, delete if no longer needed
- Check for objects in default containers
- Verify delegation permissions are still appropriate

**Quarterly:**
- Review OU structure for efficiency
- Document any changes
- Update delegation documentation
- Audit OU permissions

**Annually:**
- Complete OU structure review
- Plan for growth/changes
- Clean up empty or redundant OUs
- Update naming conventions if needed

## Summary

You've learned how to design and implement a professional Organizational Unit structure for Active Directory.

### What You've Accomplished

- [x] Understood OUs vs. Groups vs. Containers
- [x] Learned OU design principles (Group Policy first, not org chart)
- [x] Reviewed recommended structures for homelab, small business, and enterprise
- [x] Created OUs using GUI and PowerShell
- [x] Moved objects from default containers to proper OUs
- [x] Redirected default user/computer creation
- [x] Implemented delegation of control
- [x] Learned common mistakes and how to avoid them
- [x] Planned for reorganization if needed

### Homelab Learning Outcomes

By completing this guide, you've gained:
- **Organizational skills**: Structuring large-scale directory services
- **Design thinking**: Planning for scalability and delegation
- **PowerShell automation**: Bulk OU creation and object management
- **Security awareness**: Separating admin and user accounts
- **Real-world experience**: Skills directly applicable to enterprise environments

### What's Next

Now that your OU structure is in place, you're ready to apply policies:

**[Group Policy Structure Guide]({% post_url 2025-12-27-How-to-Design-Group-Policy-Structure %})** **(Next Step)**
- Link GPOs to your new OU structure
- Implement security baselines
- Configure user and computer settings
- Master GPO precedence and inheritance
- Troubleshoot Group Policy issues

**Additional Infrastructure Tasks:**
- Create user accounts for your homelab
- Set up security groups for resource access
- Configure DHCP server with reservations
- Implement automated user provisioning
- Set up AD recycle bin for object recovery

## Resources

- [Active Directory Administrative Center](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/adac/introduction-to-active-directory-administrative-center-enhancements--level-100-)
- [Delegation of Administration](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/delegating-administration-by-using-ou-objects)
- [Best Practice Active Directory Design for Managing Windows Networks](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/creating-an-organizational-unit-design)
- [New-ADOrganizationalUnit PowerShell Reference](https://learn.microsoft.com/en-us/powershell/module/activedirectory/new-adorganizationalunit)
- [Designing the Organizational Unit Structure](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/creating-an-organizational-unit-design)
