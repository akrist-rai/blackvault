/*
   BLACKVAULT — YARA Detection Rules
   Educational rule set for the 12-phase curriculum.
   Each rule documents its detection logic inline.

   Usage:
     yara -r range/yara/rules.yar <target_dir>
     yara -s range/yara/rules.yar <single_file>

   References: Phases 4 (static), 7 (unpacking), 11 (rootkits)
*/

import "pe"
import "math"

/* ================================================================
   SECTION 1 — Packing Indicators
   Detect binaries likely to be packed or self-decrypting.
   ================================================================ */

rule BV_Packed_MinimalImports {
    meta:
        description  = "PE with fewer than 3 imports — strong packing indicator"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        reference    = "Import table with only LoadLibrary + GetProcAddress"
        severity     = "high"
        mitre        = "T1027 — Obfuscated Files or Information"
    condition:
        uint16(0) == 0x5A4D and          // MZ header
        pe.number_of_imports < 3
}

rule BV_Packed_HighEntropyText {
    meta:
        description  = "PE .text section entropy > 7.2 — likely packed/encrypted code"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "high"
        mitre        = "T1027 — Obfuscated Files or Information"
    condition:
        uint16(0) == 0x5A4D and
        for any i in (0..pe.number_of_sections - 1) : (
            pe.sections[i].name == ".text" and
            math.entropy(pe.sections[i].raw_data_offset, pe.sections[i].raw_data_size) > 7.2
        )
}

rule BV_Packed_UPX {
    meta:
        description  = "Binary packed with UPX — detects UPX section names"
        author       = "BLACKVAULT curriculum"
        phase        = "7 (Unpacking)"
        severity     = "medium"
        mitre        = "T1027.002 — Software Packing"
    strings:
        $upx0 = "UPX0" ascii
        $upx1 = "UPX1" ascii
        $upx2 = "UPX!" ascii nocase
    condition:
        uint16(0) == 0x5A4D and
        ($upx0 and $upx1) or $upx2
}

rule BV_Packed_RWX_Section {
    meta:
        description  = "PE section is Read + Write + Execute — shellcode loader indicator"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "high"
        mitre        = "T1055 — Process Injection"
        note         = "IMAGE_SCN_MEM_READ(0x40000000) | IMAGE_SCN_MEM_WRITE(0x80000000) | IMAGE_SCN_MEM_EXECUTE(0x20000000)"
    condition:
        uint16(0) == 0x5A4D and
        for any i in (0..pe.number_of_sections - 1) : (
            (pe.sections[i].characteristics & 0xE0000000) == 0xE0000000
        )
}

rule BV_Packed_ZeroTimestamp {
    meta:
        description  = "PE TimeDateStamp is zero — packers and toolkits often zero this field"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "low"
        mitre        = "T1027 — Obfuscated Files or Information"
    condition:
        uint16(0) == 0x5A4D and
        pe.timestamp == 0
}


/* ================================================================
   SECTION 2 — Capability Clusters
   Detect specific API combinations indicative of malware behaviour.
   ================================================================ */

rule BV_Capability_ProcessInjection {
    meta:
        description  = "Imports consistent with classic remote process injection"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "critical"
        mitre        = "T1055 — Process Injection"
    condition:
        uint16(0) == 0x5A4D and
        pe.imports("kernel32.dll", "VirtualAllocEx") and
        pe.imports("kernel32.dll", "WriteProcessMemory") and
        pe.imports("kernel32.dll", "CreateRemoteThread")
}

rule BV_Capability_ReflectiveLoader {
    meta:
        description  = "Strings indicative of a reflective DLL loader"
        author       = "BLACKVAULT curriculum"
        phase        = "7 (Unpacking)"
        severity     = "critical"
        mitre        = "T1055.001 — Dynamic-link Library Injection"
    strings:
        $rl1 = "ReflectiveLoader" ascii wide
        $rl2 = "LoadRemoteLibraryR" ascii wide
        $rl3 = "ReflectiveDLLInjection" ascii wide
    condition:
        uint16(0) == 0x5A4D and any of them
}

rule BV_Capability_AntiDebug {
    meta:
        description  = "Imports used for anti-debugging / anti-analysis checks"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "medium"
        mitre        = "T1497.001 — System Checks"
    condition:
        uint16(0) == 0x5A4D and
        (
            pe.imports("kernel32.dll", "IsDebuggerPresent") or
            pe.imports("ntdll.dll", "NtQueryInformationProcess") or
            pe.imports("kernel32.dll", "CheckRemoteDebuggerPresent")
        )
}

rule BV_Capability_Persistence_RunKey {
    meta:
        description  = "Imports + registry key string consistent with Run key persistence"
        author       = "BLACKVAULT curriculum"
        phase        = "3 (PE/ELF Format)"
        severity     = "high"
        mitre        = "T1547.001 — Boot/Logon Autostart: Registry Run Keys"
    strings:
        $reg1 = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" ascii wide nocase
        $reg2 = "HKEY_CURRENT_USER" ascii wide nocase
        $reg3 = "HKEY_LOCAL_MACHINE" ascii wide nocase
    condition:
        uint16(0) == 0x5A4D and
        $reg1 and ($reg2 or $reg3) and
        pe.imports("advapi32.dll", "RegSetValueExA")
}

rule BV_Capability_CryptoRansom {
    meta:
        description  = "Imports consistent with ransomware encryption behaviour"
        author       = "BLACKVAULT curriculum"
        phase        = "12 (Full Investigation)"
        severity     = "critical"
        mitre        = "T1486 — Data Encrypted for Impact"
    condition:
        uint16(0) == 0x5A4D and
        (
            pe.imports("advapi32.dll", "CryptEncrypt") or
            pe.imports("bcrypt.dll", "BCryptEncrypt")
        ) and
        pe.imports("kernel32.dll", "FindFirstFileW") and
        pe.imports("kernel32.dll", "FindNextFileW")
}

rule BV_Capability_NetworkC2 {
    meta:
        description  = "Network connectivity imports often used by C2 implants"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "high"
        mitre        = "T1071 — Application Layer Protocol"
    condition:
        uint16(0) == 0x5A4D and
        (
            (pe.imports("winhttp.dll", "WinHttpOpen") and pe.imports("winhttp.dll", "WinHttpSendRequest")) or
            (pe.imports("ws2_32.dll", "WSAStartup") and pe.imports("ws2_32.dll", "connect"))
        )
}

rule BV_Capability_CredDump {
    meta:
        description  = "Strings consistent with LSASS credential dumping"
        author       = "BLACKVAULT curriculum"
        phase        = "8 (Memory Forensics)"
        severity     = "critical"
        mitre        = "T1003.001 — OS Credential Dumping: LSASS Memory"
    strings:
        $lsass1 = "lsass.exe" ascii wide nocase
        $lsass2 = "SeDebugPrivilege" ascii wide
        $lsass3 = "NtReadVirtualMemory" ascii wide
        $lsass4 = "MiniDumpWriteDump" ascii wide
    condition:
        uint16(0) == 0x5A4D and
        2 of ($lsass1, $lsass2, $lsass3, $lsass4)
}


/* ================================================================
   SECTION 3 — String-based IOC Rules
   Detect specific hardcoded indicators (adjust per sample).
   ================================================================ */

rule BV_IOC_MutexInfectionMarker {
    meta:
        description  = "Common malware infection-marker mutex names"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "medium"
        mitre        = "T1480 — Execution Guardrails"
        note         = "Update $m strings with sample-specific mutex names"
    strings:
        $m1 = "Global\\MicrosoftWindowsUpdateAgent" ascii wide
        $m2 = "Local\\XmlParserMutex" ascii wide
        $m3 = "{1D6FC66E-D1F3-422C-8A53-C0BBCF3D900D}" ascii wide
        $m4 = "RottenBanana" ascii wide
        $m5 = "L0aDB@l@nC3r" ascii wide
    condition:
        any of them
}

rule BV_IOC_Base64EncodedPE {
    meta:
        description  = "Base64-encoded MZ header — PE hidden inside another file"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis)"
        severity     = "high"
        mitre        = "T1027 — Obfuscated Files or Information"
    strings:
        // Base64 of "MZ" (0x4D 0x5A) prefix variants
        $b64_mz1 = "TVqQ" ascii
        $b64_mz2 = "TVpA" ascii
        $b64_mz3 = "TVpQ" ascii
        $b64_mz4 = "4D5A" ascii nocase   // hex-encoded MZ
    condition:
        any of them
}

rule BV_IOC_PowerShellDownloadCradle {
    meta:
        description  = "PowerShell download cradle patterns used in fileless attacks"
        author       = "BLACKVAULT curriculum"
        phase        = "6 (Dynamic Analysis)"
        severity     = "high"
        mitre        = "T1059.001 — PowerShell"
    strings:
        $ps1 = "IEX" ascii wide nocase
        $ps2 = "Invoke-Expression" ascii wide nocase
        $ps3 = "DownloadString" ascii wide nocase
        $ps4 = "Net.WebClient" ascii wide nocase
        $ps5 = "FromBase64String" ascii wide nocase
        $ps6 = "-EncodedCommand" ascii wide nocase
        $ps7 = "-enc " ascii wide nocase
    condition:
        3 of them
}

rule BV_IOC_WMIPersistence {
    meta:
        description  = "WMI event subscription persistence strings"
        author       = "BLACKVAULT curriculum"
        phase        = "6 (Dynamic Analysis)"
        severity     = "high"
        mitre        = "T1546.003 — Event Triggered Execution: Windows Management Instrumentation"
    strings:
        $wmi1 = "__EventFilter" ascii wide
        $wmi2 = "__EventConsumer" ascii wide
        $wmi3 = "__FilterToConsumerBinding" ascii wide
        $wmi4 = "ActiveScriptEventConsumer" ascii wide
        $wmi5 = "CommandLineEventConsumer" ascii wide
    condition:
        2 of them
}

rule BV_IOC_ScheduledTaskXML {
    meta:
        description  = "Scheduled task XML with a suspicious command"
        author       = "BLACKVAULT curriculum"
        phase        = "3 (PE/ELF Format)"
        severity     = "medium"
        mitre        = "T1053.005 — Scheduled Task"
    strings:
        $xml1 = "<Task " ascii
        $xml2 = "<Command>" ascii
        $ps   = "powershell" ascii nocase
        $enc  = "-enc" ascii nocase
    condition:
        $xml1 and $xml2 and ($ps or $enc)
}


/* ================================================================
   SECTION 4 — Rootkit / Kernel-mode Indicators
   Detect drivers or ELF modules with rootkit characteristics.
   Phase 11 (Rootkits).
   ================================================================ */

rule BV_Rootkit_WindowsDriver {
    meta:
        description  = "PE that is a kernel driver — native image for ring-0 code"
        author       = "BLACKVAULT curriculum"
        phase        = "11 (Rootkits & Kernel Analysis)"
        severity     = "high"
        mitre        = "T1014 — Rootkit"
        note         = "Not malicious by itself; context is everything"
    condition:
        uint16(0) == 0x5A4D and
        pe.is_pe and
        pe.characteristics & 0x2000 == 0x2000 and   // IMAGE_FILE_DLL not set sometimes
        pe.subsystem == pe.SUBSYSTEM_NATIVE           // Native subsystem = kernel driver
}

rule BV_Rootkit_SSDTHookStrings {
    meta:
        description  = "Strings indicative of SSDT hook installation"
        author       = "BLACKVAULT curriculum"
        phase        = "11 (Rootkits & Kernel Analysis)"
        severity     = "critical"
        mitre        = "T1014 — Rootkit"
    strings:
        $s1 = "KeServiceDescriptorTable" ascii
        $s2 = "KeServiceDescriptorTableShadow" ascii
        $s3 = "NtQuerySystemInformation" ascii
        $s4 = "MmGetSystemRoutineAddress" ascii
    condition:
        uint16(0) == 0x5A4D and
        2 of them
}

rule BV_Rootkit_MFTManipulation {
    meta:
        description  = "Strings consistent with direct MFT or raw NTFS access (hiding files)"
        author       = "BLACKVAULT curriculum"
        phase        = "11 (Rootkits & Kernel Analysis)"
        severity     = "critical"
        mitre        = "T1564.001 — Hide Artifacts: Hidden Files and Directories"
    strings:
        $ntfs1 = "\\\\.\\PhysicalDrive" ascii wide
        $ntfs2 = "\\Device\\HarddiskVolume" ascii wide
        $ntfs3 = "$MFT" ascii wide
        $ntfs4 = "\\$Extend" ascii wide
    condition:
        2 of them
}


/* ================================================================
   SECTION 5 — ELF Specific Rules (Linux malware / implants)
   ================================================================ */

rule BV_ELF_Stripped {
    meta:
        description  = "ELF binary with no symbol table — likely stripped to hinder RE"
        author       = "BLACKVAULT curriculum"
        phase        = "5 (Ghidra Analysis)"
        severity     = "low"
        note         = "Not malicious alone; malware routinely strips binaries"
    condition:
        uint32(0) == 0x464C457F and        // ELF magic
        not for any i in (0..elf.number_of_sections - 1) : (
            elf.sections[i].type == elf.SHT_SYMTAB
        )
}

rule BV_ELF_ReverseShellStrings {
    meta:
        description  = "ELF with reverse shell indicator strings"
        author       = "BLACKVAULT curriculum"
        phase        = "6 (Dynamic Analysis)"
        severity     = "critical"
        mitre        = "T1059.004 — Unix Shell"
    strings:
        $sh1 = "/bin/sh" ascii
        $sh2 = "/bin/bash" ascii
        $net = "connect" ascii
        $s3  = "dup2" ascii
        $s4  = "execve" ascii
    condition:
        uint32(0) == 0x464C457F and
        ($sh1 or $sh2) and $net and $s3 and $s4
}

rule BV_ELF_LD_PRELOAD_Abuse {
    meta:
        description  = "ELF or script referencing LD_PRELOAD for hooking"
        author       = "BLACKVAULT curriculum"
        phase        = "11 (Rootkits & Kernel Analysis)"
        severity     = "high"
        mitre        = "T1574.006 — Hijack Execution Flow: Dynamic Linker Hijacking"
    strings:
        $lp1 = "LD_PRELOAD" ascii
        $lp2 = "/etc/ld.so.preload" ascii
    condition:
        any of them
}


/* ================================================================
   SECTION 6 — Composite Rules (combine multiple signals)
   High-fidelity rules with very low false-positive rate.
   ================================================================ */

rule BV_HighConf_Loader_Stub {
    meta:
        description  = "High-confidence packed loader: minimal imports + high entropy + no debug info"
        author       = "BLACKVAULT curriculum"
        phase        = "4 (Static Analysis) + 7 (Unpacking)"
        severity     = "critical"
        mitre        = "T1027.002 — Software Packing"
    condition:
        uint16(0) == 0x5A4D and
        pe.number_of_imports < 4 and
        pe.number_of_sections >= 2 and
        for any i in (0..pe.number_of_sections - 1) : (
            math.entropy(pe.sections[i].raw_data_offset, pe.sections[i].raw_data_size) > 7.4
        ) and
        not pe.has_rich_signature and
        pe.timestamp < 1000000000      // epoch 0 or near-zero
}

rule BV_HighConf_Fileless_PowerShell {
    meta:
        description  = "High-confidence fileless PowerShell dropper chain"
        author       = "BLACKVAULT curriculum"
        phase        = "6 (Dynamic Analysis)"
        severity     = "critical"
        mitre        = "T1059.001 — PowerShell, T1055 — Process Injection"
    strings:
        $enc   = "-enc" ascii nocase
        $iex   = "IEX" ascii wide nocase
        $dls   = "DownloadString" ascii wide nocase
        $b64   = "FromBase64String" ascii wide nocase
        $winhttp = "New-Object Net.WebClient" ascii wide nocase
    condition:
        ($enc or $iex) and ($dls or $winhttp) and $b64
}

rule BV_HighConf_Ransomware_EarlyStage {
    meta:
        description  = "Early-stage ransomware characteristics: enumerate + encrypt + shadow copy delete"
        author       = "BLACKVAULT curriculum"
        phase        = "12 (Full Investigation)"
        severity     = "critical"
        mitre        = "T1486 — Data Encrypted for Impact, T1490 — Inhibit System Recovery"
    strings:
        $vss1 = "vssadmin" ascii wide nocase
        $vss2 = "delete shadows" ascii wide nocase
        $vss3 = "wbadmin" ascii wide nocase
        $note1 = "YOUR FILES" ascii wide nocase
        $note2 = "bitcoin" ascii wide nocase
        $note3 = ".onion" ascii wide nocase
        $ext1  = "README" ascii wide nocase
        $ext2  = "DECRYPT" ascii wide nocase
    condition:
        ($vss1 and $vss2) and (2 of ($note1, $note2, $note3, $ext1, $ext2))
}
