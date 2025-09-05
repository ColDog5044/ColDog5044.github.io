---
layout: post
title: "How to Resize an Ubuntu Linux LVM Partition"
date: 2025-09-05 10:15:00 -0400
categories: [Linux, Ubuntu]
tags: [homelab, linux, ubuntu, terminal, cli, sysadmin, lvm, partition, disk-management, filesystem]
---

## Introduction

Logical Volume Management (LVM)[^lvm] is a powerful feature in Linux that provides flexible disk space management. However, resizing LVM partitions can be intimidating for beginners. This guide walks you through the complete process of resizing an Ubuntu Linux LVM partition to utilize additional disk space.

In this tutorial, we'll expand a 28GB root partition to use the full 40GB available on the disk. The process involves resizing the physical partition, extending the physical volume (PV), expanding the logical volume (LV), and finally resizing the filesystem.

> **Warning:**  
> Prior to resizing your partition(s), ensure you have a working backup/snapshot to revert in case anything goes wrong. Partition operations can be destructive if not performed correctly.
{: .prompt-danger }

> This post assumes you are running as the `root` user, as some commands require elevated permissions.
{: .prompt-info }

## Step 1: Verify the Current Partition and LVM Structure

```bash
root@ubuntu:~# lsblk
NAME                      MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
sda                         8:0    0  40G  0 disk
├─sda1                      8:1    0   1M  0 part
├─sda2                      8:2    0   2G  0 part /boot
└─sda3                      8:3    0  28G  0 part
  └─ubuntu--vg-ubuntu--lv 252:0    0  28G  0 lvm  /
```

In this case, we want to resize `sda3`, our root `/` partition to fill the rest of our disk space `40GB`.

Let's examine the current LVM structure:

**Check Physical Volumes (PVs):**

```bash
root@ubuntu:~# pvs
  PV         VG        Fmt  Attr PSize   PFree
  /dev/sda3  ubuntu-vg lvm2 a--  <28.00g    0
```

**Check Volume Groups (VGs):**

```bash
root@ubuntu:~# vgs
  VG        #PV #LV #SN Attr   VSize   VFree
  ubuntu-vg   1   1   0 wz--n- <28.00g    0
```

**Check Logical Volumes (LVs):**

```bash
root@ubuntu:~# lvs
  LV        VG        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  ubuntu-lv ubuntu-vg -wi-ao---- <28.00g
```

**Verify the mount point:**

```bash
root@ubuntu:~# mount
/dev/mapper/ubuntu--vg-ubuntu--lv on / type ext4 (rw,relatime)
```

## Step 2: Resize the Physical Partition

First, we need to expand the physical partition `/dev/sda3` to use the available disk space. We'll use `fdisk` for this operation.

```bash
fdisk /dev/sda
```

**View the current partition table:**

```bash
Command (m for help): p

Disk /dev/sda: 40 GiB, 42949672960 bytes, 83886080 sectors
Disk model: Virtual disk
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

Device       Start      End  Sectors Size Type
/dev/sda1     2048     4095     2048   1M BIOS boot
/dev/sda2     4096  4198399  4194304   2G Linux filesystem
/dev/sda3  4198400 62912511 58714112  28G Linux filesystem
```

**Delete the existing partition 3:**

```bash
Command (m for help): d
Partition number (1-3, default 3): 3

Partition 3 has been deleted.

Command (m for help): p
Disk /dev/sda: 40 GiB, 42949672960 bytes, 83886080 sectors
Disk model: Virtual disk
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

Device     Start     End Sectors Size Type
/dev/sda1   2048    4095    2048   1M BIOS boot
/dev/sda2   4096 4198399 4194304   2G Linux filesystem
```

**Create a new, larger partition 3:**

```bash
Command (m for help): n
Partition number (3-128, default 3): 3
First sector (4198400-83886046, default 4198400):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (4198400-83886046, default 83884031):

Created a new partition 3 of type 'Linux filesystem' and of size 38 GiB.
Partition #3 contains a LVM2_member signature.

Do you want to remove the signature? [Y]es/[N]o: n
```

> **Note:** We choose "n" to keep the LVM signature, as we want to preserve the existing LVM structure.
{: .prompt-info }

**Verify the new partition layout:**

```bash
Command (m for help): p

Disk /dev/sda: 40 GiB, 42949672960 bytes, 83886080 sectors
Disk model: Virtual disk
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

Device       Start      End  Sectors Size Type
/dev/sda1     2048     4095     2048   1M BIOS boot
/dev/sda2     4096  4198399  4194304   2G Linux filesystem
/dev/sda3  4198400 83884031 79685632  38G Linux filesystem
```

**Save the changes:**

```bash
Command (m for help): w
The partition table has been altered.
Syncing disks.
```

**Verify the partition resize worked:**

```bash
root@ubuntu:~# lsblk
NAME                      MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
sda                         8:0    0  40G  0 disk
├─sda1                      8:1    0   1M  0 part
├─sda2                      8:2    0   2G  0 part /boot
└─sda3                      8:3    0  38G  0 part
  └─ubuntu--vg-ubuntu--lv 252:0    0  28G  0 lvm  /
```

Great! The partition `/dev/sda3` is now 38G instead of 28G, but the LVM logical volume is still 28G.

## Step 3: Resize the Physical Volume (PV)

Now we need to inform LVM that the physical volume has grown.

**Check the current PV size:**

```bash
root@ubuntu:~# pvs
  PV         VG        Fmt  Attr PSize   PFree
  /dev/sda3  ubuntu-vg lvm2 a--  <28.00g    0
```

**Resize the physical volume:**

```bash
root@ubuntu:~# pvresize /dev/sda3
  Physical volume "/dev/sda3" changed
  1 physical volume(s) resized or updated / 0 physical volume(s) not resized
```

**Verify the PV has been resized:**

```bash
root@ubuntu:~# pvs
  PV         VG        Fmt  Attr PSize   PFree
  /dev/sda3  ubuntu-vg lvm2 a--  <38.00g 10.00g
```

Perfect! Now we can see that the physical volume is 38GB with 10GB of free space.

## Step 4: Extend the Logical Volume (LV)

Now we need to extend the logical volume to use the newly available space in the volume group.

**Check the current volume group status:**

```bash
root@ubuntu:~# vgs
  VG        #PV #LV #SN Attr   VSize   VFree
  ubuntu-vg   1   1   0 wz--n- <38.00g 10.00g
```

**Extend the logical volume to use all available space:**

```bash
root@ubuntu:~# lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
  Size of logical volume ubuntu-vg/ubuntu-lv changed from <28.00 GiB (7167 extents) to <38.00 GiB (9727 extents).
  Logical volume ubuntu-vg/ubuntu-lv successfully resized.
```

> **Note:** The `-l +100%FREE` option extends the logical volume to use all available free space in the volume group.
{: .prompt-info }

**Verify the logical volume has been extended:**

```bash
root@ubuntu:~# lvs
  LV        VG        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  ubuntu-lv ubuntu-vg -wi-ao---- <38.00g
```

Excellent! The logical volume is now 38GB.

## Step 5: Resize the Filesystem

The final step is to resize the actual filesystem to use the newly available space. Note that the filesystem is still showing 28GB even though the logical volume is now 38GB.

**Check current filesystem size:**

```bash
root@ubuntu:~# df -h
Filesystem                         Size  Used Avail Use% Mounted on
tmpfs                              392M  1.3M  391M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv   28G   22G  4.0G  85% /
tmpfs                              2.0G  8.0K  2.0G   1% /dev/shm
tmpfs                              5.0M     0  5.0M   0% /run/lock
/dev/sda2                          2.0G  192M  1.6G  11% /boot
tmpfs                              392M   12K  392M   1% /run/user/1001
tmpfs                              392M   12K  392M   1% /run/user/0
```

Notice that the root filesystem (`/`) is still showing 28G.

**Resize the ext4 filesystem:**

```bash
root@ubuntu:~# resize2fs /dev/ubuntu-vg/ubuntu-lv
resize2fs 1.47.0 (5-Feb-2023)
Filesystem at /dev/ubuntu-vg/ubuntu-lv is mounted on /; on-line resizing required
old_desc_blocks = 4, new_desc_blocks = 5
The filesystem on /dev/ubuntu-vg/ubuntu-lv is now 9960448 (4k) blocks long.
```

> **Note:** The `resize2fs` command performs an online resize[^online-resize], meaning it can resize the filesystem while it's mounted and in use.
{: .prompt-info }

**Verify the final result:**

```bash
root@ubuntu:~# df -h
Filesystem                         Size  Used Avail Use% Mounted on
tmpfs                              392M  1.3M  391M   1% /run
/dev/mapper/ubuntu--vg-ubuntu--lv   38G   22G   14G  63% /
tmpfs                              2.0G  8.0K  2.0G   1% /dev/shm
tmpfs                              5.0M     0  5.0M   0% /run/lock
/dev/sda2                          2.0G  192M  1.6G  11% /boot
tmpfs                              392M   12K  392M   1% /run/user/1001
tmpfs                              392M   12K  392M   1% /run/user/0
```

## Final Verification

**Confirm all changes are persistent after reboot:**
```bash
# Check that changes survive a reboot
reboot
# After reboot, verify:
lsblk
df -h
pvs && vgs && lvs
```

Perfect! The root filesystem now shows 38G total space with 14G available (compared to 4G before the resize).

## Summary

We have successfully resized the Ubuntu Linux LVM partition from 28GB to 38GB. The process involved:

1. **Verifying the current setup** - Understanding the partition layout and LVM structure
2. **Resizing the physical partition** - Using `fdisk` to expand `/dev/sda3`
3. **Expanding the physical volume** - Using `pvresize` to inform LVM of the partition growth
4. **Extending the logical volume** - Using `lvextend` to allocate the new space
5. **Resizing the filesystem** - Using `resize2fs` to expand the ext4[^ext4] filesystem

The disk utilization improved from 85% to 63%, providing an additional 10GB of usable space.

> This process can be performed on a live system without downtime, as all operations support online resizing. However, always ensure you have proper backups before performing partition operations.
{: .prompt-tip }

## Troubleshooting

### Common Issues

**"No space left on device" during resize:**
```bash
# Check if there's actually free space in the VG
vgs
# If VFree shows 0, the partition resize may not have been recognized
# Try running partprobe to refresh the partition table
partprobe /dev/sda
```

**Filesystem resize fails:**
```bash
# For XFS filesystems, use xfs_growfs instead of resize2fs
xfs_growfs /
```

**LVM commands not found:**
```bash
# Install LVM tools if missing
apt update && apt install lvm2
```

**Permission denied errors:**
```bash
# Ensure you're running as root or with sudo
sudo su -
# Or
sudo bash
# Or prefix each command with sudo
sudo pvresize /dev/sda3
```

---

## Footnotes

[^lvm]: LVM (Logical Volume Management) provides a layer of abstraction between physical storage devices and filesystems, allowing for dynamic resizing, snapshots, and flexible storage allocation without the limitations of traditional partitioning schemes.

[^online-resize]: Online resizing allows filesystem expansion while the system is running and the filesystem is mounted and actively being used. This is particularly useful for production systems where downtime must be minimized.

[^ext4]: ext4 (fourth extended filesystem) is the default filesystem for most Linux distributions. It supports online resizing, large file sizes (up to 16TB), and volumes up to 1EB. Alternative filesystems like XFS and Btrfs also support online resizing.

---

## Resources

- [Ubuntu LVM Documentation](https://ubuntu.com/server/docs/device-mapper-multipathing-introduction)
- [Red Hat LVM Administrator Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/configuring_and_managing_logical_volumes/index)
- [Linux LVM HOWTO](https://tldp.org/HOWTO/LVM-HOWTO/)
- [ext4 Filesystem Documentation](https://ext4.wiki.kernel.org/)
- [fdisk Manual Page](https://man7.org/linux/man-pages/man8/fdisk.8.html)