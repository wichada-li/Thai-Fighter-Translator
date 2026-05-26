เปิด Feature ก่อนติดตั้ง
:Powershell Run Admin
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Install Claude

:Powershell Run Admin

Add-AppxProvisionedPackage -Online -PackagePath "Claude.msix" -SkipLicense -Regions "all"

ติดตั้งเสร็จแว๊บเดียว แล้วค้นหาใน All Program ชื่อ Claude จะเจอเป็น App Pin to TaskBar