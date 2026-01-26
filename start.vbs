Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' Caminho da pasta onde o VBS está localizado
projectPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Executa o start.js invisível e separado
shell.Run "node """ & projectPath & "\scripts\start.js"" prod", 0, False
