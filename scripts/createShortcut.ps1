$desktop = [Environment]::GetFolderPath("Desktop")
$projectPath = (Get-Location).Path

$shortcutPath = "$desktop\Minhas Financas.lnk"
$target = "$projectPath\start.vbs"  # invisível
$icon = "$projectPath\assets\icon.ico"

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)

$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $projectPath
$shortcut.IconLocation = $icon
$shortcut.Save()

Write-Host "✅ Atalho criado na Área de Trabalho"
