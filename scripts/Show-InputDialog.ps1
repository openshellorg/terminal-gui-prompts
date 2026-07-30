# Shows a native Windows input dialog and prints the entered text to stdout (one line).
# Usage: pwsh -File Show-InputDialog.ps1 -Message "..." -Title "..." [-Default "..."]

param(
    [Parameter(Mandatory = $true)]
    [string] $Message,

    [Parameter(Mandatory = $false)]
    [string] $Title = "Input",

    [Parameter(Mandatory = $false)]
    [string] $Default = ""
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = $Title
$form.Size = New-Object System.Drawing.Size(400, 120)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.Topmost = $true

$label = New-Object System.Windows.Forms.Label
$label.Location = New-Object System.Drawing.Point(10, 10)
$label.Size = New-Object System.Drawing.Size(360, 20)
$label.Text = $Message
$form.Controls.Add($label)

$textBox = New-Object System.Windows.Forms.TextBox
$textBox.Location = New-Object System.Drawing.Point(10, 35)
$textBox.Size = New-Object System.Drawing.Size(360, 20)
$textBox.Text = $Default
$form.Controls.Add($textBox)

$okButton = New-Object System.Windows.Forms.Button
$okButton.Location = New-Object System.Drawing.Point(210, 60)
$okButton.Size = New-Object System.Drawing.Size(75, 23)
$okButton.Text = "OK"
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $okButton
$form.Controls.Add($okButton)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(295, 60)
$cancelButton.Size = New-Object System.Drawing.Size(75, 23)
$cancelButton.Text = "Cancel"
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $cancelButton
$form.Controls.Add($cancelButton)

$result = $form.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $textBox.Text
    exit 0
} else {
    exit 1
}
