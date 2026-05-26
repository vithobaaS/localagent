Set WinScriptHost = CreateObject("WScript.Shell")

WinScriptHost.Run "C:\xampp\php\php.exe  C:\xampp\htdocs\webapp\localagent\library\cron\FileTransferCron.php", 0

Set WinScriptHost = Nothing