<?php

require 'vendor/autoload.php';
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Remote\RemoteWebDriver;
//use PHPUnit\Extensions\AppiumTestCase\TouchAction;
//require_once('PHPUnit/Extensions/AppiumTestCase/TouchAction.php');
require_once 'PHPUnit/Extensions/AppiumTestCase/Element.php';

class MobileAppTest extends PHPUnit_Framework_TestCase {

	protected $captureScreenshotOnFailure = TRUE;
	protected $screenshotPath = 'screenshot';

	// protected $screenshotUrl = 'http://13.126.37.32:8081/screenshots/';

	public $goto_steps_result = array();

	public $goto_con = '';

	public static $browsers = array();
	public $mobileDriver;

	public function __construct() {

		$this->dependency_case_res = 1;

		$browsers = array(
			array(
				'local' => true,
				'host' => '127.0.0.1',
				'port' => 4723,
				'browserName' => '',
				"browserUrl" => "com.boingo.boingowifi",
				'seleniumServerRequestsTimeout' => '6000',
				'desiredCapabilities' => array(

					// 'app' => APP_PATH."/android-debug.apk",
					// 'app' => APP_PATH."/Boingo-Wi-Finder.apk",
					// 'platformVersion' => '5.1.1',
					'deviceName' => 'Android',
					'platformName' => 'Android',
					'autoGrantPermissions' => true,
					// "autoWebview" =>true,
					"noReset" => true,
					// 'setWebContentsDebuggingEnabled' => true,
					"nativeWebScreenshot" => true,
					"androidScreenshotPath" => 'target/screenshots',

					// "appMainActivity" => "com.lenovo.ideafriend.ideafriendMainActivity ",
					// "appPackage" => "com.lenovo.ideafriend",
					//"appActivity" => "com.boingo.boingowifi.Activity",
					"deviceReadyTimeout" => 3000,
				),
			),
		);

		$this::$browsers = $browsers;

	}

	public function initiate_browser($packname, $activityname) {
		$parameters = $this::$browsers[0];

		$seleniumServerUrl = PHPUnit_Extensions_Selenium2TestCase_URL::fromHostAndPort($parameters['host'], $parameters['port']);

		$driver = new PHPUnit_Extensions_AppiumTestCase_Driver($seleniumServerUrl, $parameters['seleniumServerRequestsTimeout']);

		$capabilities = array_merge($parameters['desiredCapabilities'], array(
			'browserName' => $parameters['browserName'],
		));
		$app = array("appPackage" => "$packname",
			"appActivity" => "$activityname");
		$capabilities = array_merge($capabilities, $app);
// echo "<pre>";print_r($capabilities);exit;
		$this->mobileDriver = $driver->startSession($capabilities, $seleniumServerUrl);

	}

	public function sample($value, $iterationval) {

		$step_res_array = array();
		// $iteration_val = 'iteration' . $i;
		$step_res = 1;
		$case_res = 1;

		foreach ($value->$iterationval as $st) {
			// $case_res=1;
			unset($step_res_array);
			if ($step_res == '1') {
				$st->executed_status = 1;
			} else {
				$st->executed_status = 0;
			}
			$j = 0;

			foreach ($st->testSteps as $steps) {
				//  $step_res=1;

				$j++;

				$action_name = $steps->actionName;

				if ($action_name == 'Goto') {

					$goto_step_num = $steps->data;

					$step_para = $st->testSteps;

					$goto_res_ary = $this->goto_exe($step_para, $goto_step_num, $j, $steps, $step_res);

					foreach ($goto_res_ary as $go_val) {
						$step_res_array[] = $go_val;
					}
				} else {

					if ($step_res == '1' && $this->dependency_case_res == 1) {

						$step_exe_res = $this->exe_switch($steps);

						$step_res = $step_exe_res->result_status;

						$st->result_status = $step_res;

						$step_res_array[] = $step_exe_res;
					} else {

						$steps->executed_status = 0;
						// $steps->executed_status='';
						$step_res_array[] = $steps;
					}

				}

				$st->testSteps = $step_res_array;
			}

		}

		return $value;
	}

	public function goto_exe($goto_steps_val, $goto_step_num, $index, $goto_step_data, $current_step_res) {

		$go_num = 1;

		$goto_ary = array();

		foreach ($goto_steps_val as $goto_value) {

			if ($go_num >= $goto_step_num && $go_num < $index) {
				$goto_ary[] = $goto_step_data;

				$goto_ary[] = $goto_value;
			}

			$go_num++;
		}

		$return_result = $this->loop_goto($goto_ary, $current_step_res);

		return $return_result;

	}

	public function loop_goto($goto_ary, $current_step_res) {

		$while_cntn = 1;
		$goto_steps_result = array();

		$inc = 1;

		$goto_res_sta = $current_step_res;

		do {

			foreach ($goto_ary as $ary_val) {
				if ($goto_res_sta == '1') {

					$goto_exe_res_sta = $this->exe_switch($ary_val);
					$goto_res_sta = $goto_exe_res_sta->result_status;

					$goto_steps_result[] = $goto_exe_res_sta;
				} else {
					$ary_val->executed_status = 0;

					$goto_steps_result[] = $ary_val;

				}

			}

			$inc++;

		} while ($inc <= 10);

		return $goto_steps_result;
	}

	public function exe_switch($steps) {

		$dataval = $steps->data;

		$screenshot = '';
		$screenshot_error = '';
		$var_screen_image_name = '';
		$final_var = '';

		if ($steps->locatorName == "data-qa-id") {
			$xPathGen = '//*[@data-qa-id="' . $steps->objectDetail . '"]';
			$locatorName = 'xpath';
		} else {
			$xPathGen = $steps->objectDetail;
			$locatorName = $steps->locatorName;
		}
		// $var_screen_image_name=$this->takeScreenshot($steps->screenShot,$locatorName,"screenshot");
		// if ($steps->screenShot == 'Before') {

		//     $screenshot = $this->takeScreenshot($steps->screenShot, $locatorName);

		//     $steps->screenshot_path = $screenshot;

		// }

		sleep(2);
		$status = "";

		$switch_action_name = $steps->actionName;

		switch ($switch_action_name) {

		case 'Set':
			try {
				//$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				//              $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click()->sendKeys($dataval);
				$this->mobileDriver->{$locatorName}($xPathGen)->value($dataval);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$steps->executed_status = 1;
				$steps->result_status = 0;
				// status hard coded need to check
				$status = 0;
			} finally {

				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					// $this->mobileDriver->quit();
				}
			}

			break;

		case 'Click':
			try {
				$this->mobileDriver->timeouts()->implicitWait(10000);
				$this->mobileDriver->{$locatorName}($xPathGen)->click();
//              $this->webDriver->manage()->timeouts()->implicitlyWait(30);
				//              $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click();

				// $enable_val=$click->isEnabled();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				// $this->mobileDriver->quit();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				// status hard coded need to check
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					// $this->mobileDriver->quit();
				}
			}

			break;

		case 'Wait':
			try {
				$dataval = (int) $dataval;
				$this->mobileDriver->timeouts()->implicitWait($dataval);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				// $this->mobileDriver->quit();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					// $this->mobileDriver->quit();
				}
			}

			break;
		case 'WaitUntill':
			try {
				$this->mobileDriver->timeouts()->implicitWait(1000);
				$this->mobileDriver->{$locatorName}($xPathGen)->displayed();

				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				//$this->webDriver->quit();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					//$this->webDriver->quit();
				}
			}
			break;

// For assertEquals
		case 'AssertEquals':
			try {
				$this->mobileDriver->timeouts()->implicitWait(30);
				$assertDataElement = $this->mobileDriver->{$locatorName}($xPathGen);
				$givenDataVal = strtolower(trim(utf8_encode($dataval)));
				$getText = strtolower(trim($assertDataElement->text()));
				$steps->executed_status = 1;
				if ((strcmp($givenDataVal, $getText))) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {

				$steps->executed_status = 1;
				$steps->result_status = 0;

				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					// $this->mobileDriver->quit();
				}
			}

			break;

		// For assertContains
		case 'AssertContains':
			try {
				$this->mobileDriver->assertContains(
					$dataval, $this->mobileDriver->{$locatorName}($xPathGen)->text()
				);
//              $this->mobileDriver->manage()->timeouts()->implicitlyWait(30);
				//              $this->assertContains(
				//                  $dataval, $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->getText()
				//              );
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$steps->executed_status = 1;
				$steps->result_status = 0;

				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					// $this->mobileDriver->quit();
				}
			}

			break;

		}

		// if ($steps->screenShot == 'After') {
		//     if($final_var != 1)
		//     {

		//     $screenshot = $this->takeScreenshot($steps->screenShot, $locatorName);

		//     $steps->screenshot_path = $screenshot;
		//     }

		// }

		return $steps;
	}

	public function executeGroup($data) {
// echo "<pre>";print_r($data->result->testCase[0]->iteration0[0]->testSteps[0]->actionName);exit;
		$data = $this->checkappPackage($data);
		$browserTypeId = $data->result->browserTypeId;
		$testcase_interation = $data->result->testCase;
		$groupName = $data->result->groupName;
		$groupId = $data->result->groupId;
		$environmentId = $data->result->environmentId;
		$applicationId = $data->result->applicationId;
		$platformId = $data->result->platformId;
		$iterationval = $data->result->iterationval;

		$i = 0;

		// echo "<pre>";print_r($data);exit;
		// $this->initiate_browser($browserTypeId);
		foreach ($testcase_interation as $iteration) {

			$testcase_res[] = $this->sample($iteration, $iterationval);
			$i++;

		}

		$group_result_ary = array();

		foreach ($testcase_res as $value) {

			foreach ($value as $l_value) {

				foreach ($l_value as $new_val) {

					$iteration_grp_status = $new_val->result_status;
					$this->dependency_case_res = $iteration_grp_status;
					array_push($group_result_ary, $iteration_grp_status);

				}

			}
		}

		if (in_array("0", $group_result_ary)) {
			$group_result_status = 0;

		} else {

			$group_result_status = 1;
		}

		$data->result->result_status = $group_result_status;
		// $this->mobileDriver->quit();
		return $data;
	}
	public function checkappPackage($data) {

		$app = $data->result->testCase[0]->iteration0[0]->testSteps[0];

		if ($app->actionName == "AppPackage") {
			$init = $this->initiate_browser($app->objectDetail, $app->data);
			$app->executed_status = 1;
			$app->result_status = 1;
			return $data;
		} else {
			return false;
		}
	}
	public function executeSuite($data) {

		$suiteName = $data->result->suiteName;
		$suiteId = $data->result->suiteId;
		$environmentId = $data->result->environmentId;
		$applicationId = $data->result->applicationId;
		$platformId = $data->result->platformId;
		$browserTypeId = $data->result->browserTypeId;
		$testGroup = $data->result->testGroup;

		$suite_result_sta_ary = array();

		foreach ($testGroup as $groups) {

			$result_ary = array();

			$groupName = $groups->testGroupName;
			$groupId = $groups->testGroupId;

			$this->initiate_browser($browserTypeId);
			$i = 0;

			foreach ($groups->testCase as $iteration_val) {

				$return_val = $this->sample($iteration_val, $i);

				foreach ($return_val as $re_value) {

					foreach ($re_value as $final_val) {

						array_push($result_ary, $final_val->result_status);
						$iteration_ary[] = $return_val;
					}
				}

				$iterationcout = "iteration" . $i;

				$i++;

				if (in_array(0, $result_ary)) {
					$suite_grp_result_status = 0;
				} else {
					$suite_grp_result_status = 1;
				}

				array_push($suite_result_sta_ary, $suite_grp_result_status);

				$groups->result_status = $suite_grp_result_status;
			}

			// $this->mobileDriver->quit();

		}

		if (in_array(0, $suite_result_sta_ary)) {
			$suite_result = 0;
		} else {
			$suite_result = 1;
		}

		$data->result->result_status = $suite_result;

		return $data;

	}

	public function CustomSetUpFirefox() {
		$capabilities = DesiredCapabilities::firefox();

		$this->webDriver = RemoteWebDriver::create('http://localhost:6002/wd/hub', $capabilities, 60 * 1000, 60 * 1000);
	}

	public function CustomSetUpChrome() {

		$capabilities = DesiredCapabilities::chrome();

		$this->webDriver = RemoteWebDriver::create('http://localhost:6001/wd/hub', $capabilities, 60 * 1000, 60 * 1000);
	}

	public function CustomSetUpInternetExplorer() {
		$capabilities = DesiredCapabilities::internetExplorer();
		$this->webDriver = RemoteWebDriver::create('http://localhost:6002/wd/hub', $capabilities, 60 * 1000, 60 * 1000);
	}

	public function CustomSetUpEdge() {
		$capabilities = DesiredCapabilities::microsoftEdge();
		$this->webDriver = RemoteWebDriver::create('http://localhost:6003/wd/hub', $capabilities, 60 * 1000, 60 * 1000);

	}

	// //To take screen shot

	// public function takeScreenshot($event, $stepId,$folder_name='') {

	//     if($folder_name == '')
	//     {
	//         $folder_name="screenshot";
	//     }
	//     else
	//     {
	//         $folder_name="screenshot/temp";

	//     }

	//     $file_name ='../'. "$folder_name" .'/' . date('Y-m-d_H-i-s') . "_" . $event . "_" . "" . $stepId . '.png';
	//     $this->webDriver->takeScreenshot($file_name);

	//         $exp_name = explode('/', $file_name);
	//         $exp_num = (count($exp_name) - 1);
	//         $scren_shot_name = $exp_name[$exp_num];
	//         return $scren_shot_name;

	// }

	public function readImage($image_name = '') {

		if (file_exists("../screenshot/temp/$image_name")) {

			try
			{
				copy("../screenshot/temp/$image_name", "../screenshot/$image_name");

				foreach (glob('../screenshot/temp/*', GLOB_NOSORT) as $value) {
					unlink($value);
				}

				return $image_name;
			} catch (\Exception $e) {
				$image_name = '$image_name';

			} finally {return $image_name;}

		} else {
			return $image_name;
		}
	}

}

?>
