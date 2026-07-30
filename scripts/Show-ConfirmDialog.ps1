# Shows a native Windows Yes/No dialog and prints "y" or "n" to stdout.
# Used by terminal-gui-prompts when stdout is a TTY on Windows.
# Usage: pwsh -File Show-ConfirmDialog.ps1 -Message "..." -Title "..." [-Default Yes|No]
# Exit code: 0 = Yes, 1 = No (or cancel/close)

param(
    [Parameter(Mandatory = $true)]
    [string] $Message,

    [Parameter(Mandatory = $false)]
    [string] $Title = "Confirm",

    [ValidateSet('Yes', 'No')]
    [string] $Default = 'Yes'
)

Add-Type -AssemblyName System.Windows.Forms

$defaultButton = if ($Default -eq 'Yes') {
    [System.Windows.Forms.MessageBoxDefaultButton]::Button1
} else {
    [System.Windows.Forms.MessageBoxDefaultButton]::Button2
}

$result = [System.Windows.Forms.MessageBox]::Show(
    $Message,
    $Title,
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Question,
    $defaultButton
)

if ($result -eq [System.Windows.Forms.DialogResult]::Yes) {
    Write-Output "y"
    exit 0
} else {
    Write-Output "n"
    exit 1
}
