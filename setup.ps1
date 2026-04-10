$username = "398089"
 
$env:PATH += ";C:\Users\${username}\AppData\Roaming\npm"
$env:ANDROID_HOME = "C:\Users\${username}\AppData\Local\Android\Sdk"
$env:PATH += ";" + $ANDROID_HOME + "\emulator"
$env:PATH += ";" + $ANDROID_HOME + "\platform-tools"