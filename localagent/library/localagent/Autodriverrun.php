<?php
class Autodriverrun {
	public $config;
	public $driverPath;

	public function __construct($data) {
		$this->config = new Configs();
		$this->driverPath = BASE_PATH . '/' . $this->config->getData('screen_shot_path.driverpath') . '/';
		$this->startDriver($data);

	}

	public function startDriver($data) {
		try {

			$browserName = $data->result->browserTypeName;
			if ($browserName == "Chrome") {
				$port = "6001";
			}
			if ($browserName == "Firefox") {
				$port = "6000";
			}
			if ($browserName == "IE") {
				$port = "6002";
			}
			if ($browserName == "Edge") {
				$port = "6003";
			}

			$os = $this->getPlatform();
			if ($os == 'windows') {
				$jarStatus = $this->startwindowsJar($browserName, $port, $os);
			} else if ($os == 'linux') {
				$jarStatus = $this->startlinuxJar($browserName, $port, $os);
			}
		} catch (\Exception $e) {
			throw new Exception($e);
		}
	}

	protected function getPlatform() {

		$osType = PHP_OS;
		$platform = 'Unknown';
		if (isset($osType)) {
			if ($osType == 'LINUX' || $osType == 'Linux') {
				$platform = 'linux';
			} elseif ($osType == 'WINNT' || $osType == 'WINDOWS') {
				$platform = 'windows';
			}
		}
		// if(isset($u_agent)){
		// 	$platform = 'Unknown';

		// 	//Get the platform
		// 	if (preg_match('/linux/i', $u_agent)) {
		// 		$platform = 'linux';
		// 	} elseif (preg_match('/macintosh|mac os x/i', $u_agent)) {
		// 		$platform = 'mac';
		// 	} elseif (preg_match('/windows|win32/i', $u_agent)) {
		// 		$platform = 'windows';
		// 	}
		// }

		return $platform;
	}

	protected function startwindowsJar($browserType, $portNumber, $os) {

		$seleniumStandalonePort = "5555";

		$seleniumStandaloneJarStatus = $this->checkPortStatus($seleniumStandalonePort, $os);
		if (!$seleniumStandaloneJarStatus) {
			$jarStatus = $this->executeSeleniumStandaloneJar($os);
			if ($jarStatus) {
				sleep(5);
				$driverStatus = $this->checkBrowserStatus($browserType, $portNumber, $os);
				sleep(10);
				return $driverStatus;
			}
		} else {
			$driverStatus = $this->checkBrowserStatus($browserType, $portNumber, $os);
			sleep(10);
			return $driverStatus;
		}
		return true;
	}

	protected function startlinuxJar($browserType, $portNumber, $os) {

		$seleniumStandalonePort = "5555";

		$seleniumStandaloneJarStatus = $this->checkPortStatus($seleniumStandalonePort, $os);

		if (!$seleniumStandaloneJarStatus) {
			$jarStatus = $this->executeSeleniumStandaloneJar($os);
			if ($jarStatus) {
				sleep(5);
				$driverStatus = $this->checkBrowserStatus($browserType, $portNumber, $os);
				sleep(10);
				return $driverStatus;
			}
		} else {
			$driverStatus = $this->checkBrowserStatus($browserType, $portNumber, $os);
			sleep(10);
			return $driverStatus;
		}
		return true;
	}

	protected function checkPortStatus($port, $os) {
		$isPortRunning = false;

		try {
			if ($os == 'windows') {
				$command = "netstat -ano | findStr \"" . $port . "\"";
			} else {
				$command = "netstat -nalp | grep \"" . $port . "\"";
			}

			exec($command, $output);

			if ($output) {
				foreach ($output as $line) {
					if (strpos($line, $port) !== FALSE) {
						$isPortRunning = true;
						break;
					}
				}
			}
			return $isPortRunning;
		} catch (\Exception $e) {
			throw new Exception($e);
			return $isPortRunning;
		}
	}

	protected function executeSeleniumStandaloneJar($os) {
		try {
			if ($os == 'windows') {
				$cmd = "java -jar " . $this->driverPath . "selenium-server-standalone-3.11.0.jar -role hub -port 5555 > NUL";
			} else {
				$cmd = "java -jar " . $this->driverPath . "selenium-server-standalone-3.11.0.jar -role hub -port 5555";
			}
			pclose(popen("cmd /C start /B " . $cmd, "r"));
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);
			return false;
		}
	}

	protected function executeSeleniumChromeDriver($os) {
		try {
			if ($os == 'windows') {
				$cmd = 'java -Dwebdriver.chrome.driver="' . $this->driverPath . 'chrome/chromedriver.exe" -jar ' . $this->driverPath . 'selenium-server-standalone-3.11.0.jar -port 6001 -role node -hub http://localhost:5555/grid/register/ -browser "browserName=chrome, version=ANY, maxInstances=10, platform=ANY"  > driver_log.txt 2>&1';
			} else {

				$cmd = "java -Dwebdriver.chrome.driver='/usr/local/share/chromedriver'  -jar " . $this->driverPath . "selenium-server-standalone-3.11.0.jar  -port 6001 -role node -hub http://localhost:5555/grid/register/ -browser 'browserName=chrome, version=ANY, maxInstances=10, platform=ANY'";
			}

			pclose(popen("cmd /C start /B " . $cmd, "r"));
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);
			return false;
		}
	}

	protected function executeSeleniumFirefoxDriver() {
		try {
			$cmd = 'java -Dwebdriver.gecko.driver="C:\DriverFiles\firefox\geckodriver.exe"  -jar C:\DriverFiles\selenium-server-standalone-3.4.0.jar  -port 6000 -role node -hub http://localhost:5555/grid/register/ -browser "browserName=firefox, version=ANY, maxInstances=10, platform=ANY"  > NUL"';
			pclose(popen("cmd /C start /B " . $cmd, "r"));
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);
			return false;
		}
	}

	protected function executeSeleniumIEDriver() {
		try {
			$cmd = 'java -Dwebdriver.ie.driver="C:\DriverFiles\ie\IEDriverServer.exe" -jar C:\DriverFiles\selenium-server-standalone-3.4.0.jar -port 6002 -role node -hub http://localhost:5555/grid/register/ -browser "browserName=chrome, version=ANY, maxInstances=10, platform=ANY"  > NUL"';
			pclose(popen("cmd /C start /B " . $cmd, "r"));
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);
			return false;
		}

	}

	protected function executeSeleniumEdgeDriver() {
		try {
			$cmd = 'java -Dwebdriver.edge.driver="C:\DriverFiles\edge\MicrosoftWebDriver.exe" -jar C:\DriverFiles\selenium-server-standalone-3.4.0.jar -port 6003 -role node -hub http://localhost:5555/grid/register/ -browser "browserName=chrome, version=ANY, maxInstances=10, platform=ANY"  > NUL';
			pclose(popen("cmd /C start /B " . $cmd, "r"));
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);
			return false;
		}
	}

	protected function checkBrowserStatus($type, $port, $os) {
		$DriverPort = $port;
		$DriverStatus = $this->checkPortStatus($DriverPort, $os);
		if (!$DriverStatus) {
			if ($type == "Chrome") {
				$BrowserStatus = $this->executeSeleniumChromeDriver($os);
				return true;
			} elseif ($type == "Firefox") {
				$BrowserStatus = $this->executeSeleniumFirefoxDriver($os);
				return true;
			} elseif ($type == "IE") {
				//echo "Edge working"; exit;
				$BrowserStatus = $this->executeSeleniumIEDriver($os);
				return true;
			} elseif ($type == "Edge") {
				//echo "Edge working"; exit;
				$BrowserStatus = $this->executeSeleniumEdgeDriver($os);
				return true;
			} else {return false;}
		} else {
			return true;
		}

	}

}
?>