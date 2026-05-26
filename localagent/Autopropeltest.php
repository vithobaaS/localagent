<?php

require 'vendor/autoload.php';
// require('selenium-webdriver');

use Facebook\WebDriver\Interactions\WebDriverActions;
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverExpectedCondition;
use Facebook\WebDriver\WebDriverKeys;

class Autopropeltest extends PHPUnit_Framework_TestCase {

	protected $captureScreenshotOnFailure = TRUE;
	protected $screenshotPath = 'screenshot';

	// protected $screenshotUrl = 'http://13.126.37.32:8081/screenshots/';

	public $goto_steps_result = array();

	public $goto_con = '';

	public $browser_type;
	public $dependency_case_res;
	public $result_ref_id;
	public $config;
	public $screenshotfolder_path;
	public $screenshotfolder_temp;
	public $webDriver;

	public function __construct($result_ref_id) {
		$this->browser_type = '';
		$this->dependency_case_res = 1;
		$this->result_ref_id = $result_ref_id;
		$this->config = new Configs();
		$ostype = PHP_OS;
		$seperator = '/';
		if ($ostype == "WINNT") {
			$seperator = '\\';
		}
		$this->screenshotfolder_path = realpath(dirname(__FILE__) . '/..') . $seperator . $this->config->getData('screen_shot_path.path');

		$this->screenshotfolder_temp = realpath(dirname(__FILE__) . '/..') . $seperator . $this->config->getData('screen_shot_path.temppath');

		$folder_status = $this->checkDir();
	}

	public function initiate_browser($browserTypeId) {
		$this->browser_type = $browserTypeId;
		$GLOBALS['browserType'] = $browserTypeId;
		if ($browserTypeId == 1) {
			$capabilities = DesiredCapabilities::chrome();
			// Force W3C mode for modern Chrome compatibility
			$capabilities->setCapability('goog:chromeOptions', ['w3c' => true]);

			try {
				$this->webDriver = RemoteWebDriver::create('http://localhost:6001/wd/hub', $capabilities);
			} catch (\Exception $e) {
				return 0;
			}
		} elseif ($browserTypeId == 2) {
			$capabilities = DesiredCapabilities::firefox();

			$this->webDriver = RemoteWebDriver::create('http://localhost:6000/wd/hub', $capabilities);
		} elseif ($browserTypeId == 3) {
			$capabilities = DesiredCapabilities::internetExplorer();
			$this->webDriver = RemoteWebDriver::create('http://localhost:6002/wd/hub', $capabilities);
		} elseif ($browserTypeId == 4) {
			$capabilities = DesiredCapabilities::microsoftEdge();
			$this->webDriver = RemoteWebDriver::create('http://localhost:6003/wd/hub', $capabilities);
		}
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
		set_time_limit(300); // Allow up to 5 minutes per step

		$dataval = $steps->data;

		$screenshot = '';
		$screenshot_error = '';
		$var_screen_image_name = '';
		$final_var = '';
		$captureErrorLog = false;
		$error = '';
		$test_res = '';
		$fun = '';

		if ($steps->locatorName == "data-qa-id") {
			$xPathGen = '//*[@data-qa-id="' . $steps->objectDetail . '"]';
			$locatorName = 'xpath';
		} else {
			$xPathGen = $steps->objectDetail;
			$locatorName = $steps->locatorName;
		}
		$var_screen_image_name = $this->takeScreenshot($steps->screenShot, $locatorName, "screenshot");
		if ($steps->screenShot == 'Before') {
			$screenshot = $this->takeScreenshot($steps->screenShot, $locatorName);
			$steps->screenshot_path = $screenshot;
		}

		// sleep(1) removed — was causing timeout on every step
		$status = "";
		$switch_action_name = $steps->actionName;
		switch ($switch_action_name) {
		case 'Navigate':

			try {
				error_log("Step: Navigate to " . $dataval);
				$this->webDriver->navigate()->to($dataval);
				$this->webDriver->manage()->window()->maximize();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				error_log("Error in Navigate: " . $e->getMessage());
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;
		case 'Set':
			try {
				error_log("Step: Setting value " . $dataval . " in element " . $xPathGen);
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click()->clear()->sendKeys($dataval);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		case 'Click':
			try {
				error_log("Step: Clicking element with " . $locatorName . " = " . $xPathGen);
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				error_log("Error in Click: " . $e->getMessage());
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		case 'Wait':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait($dataval);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

			//WAIT FOR GIVEN TIME
			case 'CustomWait':
			try {
				error_log("Step: Waiting for " . $dataval . " seconds...");
				if($dataval<=300){
					$givenTime    = $dataval * 1000;
				}else{
                    $givenTime    = 300 * 1000;
				}
				$milliSeconds = $givenTime;
				$this->webDriver->executeScript('var start = new Date().getTime();
				var givenTime = '."$milliSeconds".';
				while (new Date().getTime() < start + givenTime);');
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				error_log("Error in CustomWait: " . $e->getMessage());
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

// for waitUntill

		case 'WaitUntill':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(60);
				$this->webDriver->wait()->until(
					WebDriverExpectedCondition::visibilityOfElementLocated(WebDriverBy::{$locatorName}($xPathGen))
				);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		// for waitUntillwithtimer
		case 'WaitUntillWithtimer':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(120);
				$this->webDriver->wait(300, 500)->until(
					WebDriverExpectedCondition::visibilityOfElementLocated(WebDriverBy::{$locatorName}($xPathGen))
				);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

// For switchTo
		case 'SwitchTo':
			try {
				$handles = $this->webDriver->getWindowHandles();
				if (count($handles) > 0) {
					$focusWin = count($handles) - 1;
				}

				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$this->webDriver->close();
				$this->webDriver->switchTo()->window($handles[$focusWin]);
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

        // For assertEquals
		case 'AssertEquals':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$assertDataElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$givenDataVal      = strtolower(trim(utf8_encode($dataval)));
				$getText           = strtolower(trim($assertDataElement->getText()));

				$steps->executed_status = 1;
				if ((strcmp($givenDataVal, $getText))) {
					$steps->result_status = 0;
					$status = 0;
					$test_res = $steps->result_status;

				} else {
					$steps->result_status = 1;
					$status = 1;
					$test_res = $steps->result_status;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//CHECK GIVEN STRING IS PRESENT INSIDE ELEMENT TEXT
		case 'AssertContains':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$element           = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$givenDataVal      = strtolower(trim(utf8_encode($dataval)));
				$getText           = strtolower(trim($element->getText()));
				$pos               = strpos($getText, $givenDataVal);
				$steps->executed_status = 1;
				if ($pos !== false) {
					$steps->result_status = 1;
					$status = 1;
				}else{
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		// For switchToFrame
		case 'SwitchToFrame':
			try {
				$findElement =  $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$this->webDriver->switchTo()->frame($findElement);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//For windowclose
		case 'Windowclose':
			try {
				$this->webDriver->quit();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//For ScrollDown
		case 'ScrollDown':
			try {
				if (!empty($xPathGen)) {
					//scroll down by query selector
					if ($locatorName == "cssSelector") {
						$this->webDriver->executeScript('element = document.querySelector("' . $xPathGen . '");
									element.scrollIntoView(true);');
					} else if($locatorName == "id") {
						//scroll down by Id
						$this->webDriver->executeScript('element = document.getElementById("' . $xPathGen . '");
									element.scrollIntoView(true);');
					}else{
						$this->webDriver->executeScript('element = document.evaluate("'.$xPathGen.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
									element.scrollIntoView(true);');
					}
				}
				//scroll down to given data or total height
				else {
					if (!empty($dataval)) {
						$this->webDriver->executeScript('var current=window.scrollY; window.scrollTo(0,current+'.$dataval.');');
						//$this->webDriver->executeScript('window.scrollTo(0,"' . $dataval . '");');
					} else {
						$this->webDriver->executeScript('window.scrollTo(0,document.body.scrollHeight);');
					}
				}
				// $this->webDriver->executeScript('window.scrollTo(0,document.body.scrollHeight);');
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//For SelectDropDownByValue
		case 'SelectDropDownByValue':
			try {
				if ($steps->locatorName == "data-qa-id") {
					$xPathGen = '//*[@data-qa-id="' . $steps->objectDetail . '"]';
					$locatorName = 'xpath';
				} else {
					$xPathGen = $steps->objectDetail;
					$locatorName = $steps->locatorName;
				}
				if ($locatorName == "className") {
					$fun = "getElementsByClassName";}
				if ($locatorName == "name") {
					$fun = "getElementsByName";}
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
				if ($locatorName == "xpath") {
					$data_select = $this->webDriver->executeScript('var selectedValue="'.$dataval.'"; var dropdown = document.evaluate("'.$xPathGen.'",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					for(var count in dropdown.options){
					if(dropdown.options[count].text==selectedValue){
					dropdown.options[count].selected=true;
					var event = document.createEvent("HTMLEvents");
					event.initEvent("change",true,false);
					dropdown.dispatchEvent(event); return true;}}');
				}
				else{
					$data_select = $this->webDriver->executeScript('var selectedValue="'.$dataval.'"; var dropdown = document.'.$fun.'("'.$xPathGen.'");
					for(var count in dropdown.options){
					if(dropdown.options[count].text==selectedValue){
					dropdown.options[count].selected=true;
					var event = document.createEvent("HTMLEvents");
					event.initEvent("change",true,false);
					dropdown.dispatchEvent(event);return true;}}');
				}
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

        //For check radio button value
		case 'CheckRadioButtonValue':
			try {
				if ($steps->locatorName == "name") {
					$fun = "getElementsByName";}
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
				if ($locatorName == "xpath") {
					//$fun = "getElementByXPath";
					$this->webDriver->executeScript('var selectedValue="'.$dataval.'"; var radio = document.evaluate("'.$steps->objectDetail.'",document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength; for(var i=0;i<radio;i++){
	            		if(document.getElementsByName("gender")[i].getAttribute("value") == selectedValue){
	                		document.getElementsByName("gender")[i].checked="true";
	                    }}');
				}
				else{
					$this->webDriver->executeScript('
	        		var selectedValue="'.$dataval.'";
	       			var radio = document.'.$fun.'("'.$steps->objectDetail.'").length;
	        		for(var i=0;i<radio.length;i++){
	            		if(document.getElementsByName("gender")[i].getAttribute("value") == selectedValue){
	                		document.getElementsByName("gender")[i].checked="true";
	                    }}');
				}
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

        //For Set Check Box Status
		case 'SetCheckBoxStatus':
			try {
				if ($steps->locatorName == "className") {
					$fun = "getElementsByClassName";}
				if ($steps->locatorName == "name") {
					$fun = "getElementsByName";}
				if ($steps->locatorName == "id") {
					$fun = "getElementById";}
				if ($steps->locatorName == "cssSelector") {
					$fun = "querySelector";}
				if ($steps->locatorName == "xpath") {
					//$fun = "getElementByXPath";
					$this->webDriver->executeScript('var selectedValue="'.$dataval.'";var dropdown = document.evaluate("'.$steps->objectDetail.'",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if(selectedValue == "yes"){
					dropdown.checked=true;}
					else if(selectedValue == "no"){
	            	dropdown.checked=false;}');
				}
				else{
					$this->webDriver->executeScript('
					var selectedValue="'.$dataval.'";
					var dropdown = document.'.$fun.'("'.$steps->objectDetail.'");
					if(selectedValue == "yes"){
					dropdown.checked=true;  }
					else if(selectedValue == "no"){
	            	dropdown.checked=false;}');
				}
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

        //For ScrollUp
		case 'ScrollUp':
			try {
				//$this->webDriver->executeScript('window.scrollTo(0,0);');
				if (!empty($dataval)) {
					$dataval= '-'. $dataval;
					$this->webDriver->executeScript('window.scrollBy(0,"'.$dataval.'");');
				} else {
					$this->webDriver->executeScript('window.scrollTo(0,0);');
				}
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

        //For WindowMaximization
		case 'WindowMaximization':
			try {
				$this->webDriver->manage()->window()->maximize();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//UPLOAD IMAGE
		case 'UploadImage':
			// set local temp path
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$imagePath = $dataval;
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($imagePath);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO SET DATE
		case 'Date':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click()->clear()->sendKeys($dataval);

				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);

				if ($dataval == $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->getAttribute('value')) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//TO CHECK EXPECTED VALUE
		case 'ExpectedValue':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$assertDataElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$givenDataVal      = strtolower(trim(utf8_encode($dataval)));
				$getText           = strtolower(trim($assertDataElement->getText()));
				if ((strcmp($givenDataVal, $getText))) {
					$steps->result_status = 0;
					$test_res             = $steps->result_status;

				} else {
					$steps->result_status = 1;
					$test_res             = $steps->result_status;
				}
				$status = 1;
				$steps->executed_status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//TO CHECK UNEXPECTED VALUE
		case 'UnexpectedValue':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click()->sendKeys($dataval);
				//$this->insertResults($row['testschedularid'], $row['testsuiteid'], $row['id'],$timestamp,$screenshot_name);

				if ($dataval != $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->getAttribute('value')) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//TO CHECK RIGHT FLOOR COUNT IS EQUAL TO LEFT FLOOR COUNT
		case 'GetCount':
			$this->webDriver->manage()->timeouts()->implicitlyWait(30);
			try {
				$steps->executed_status = 1;
				$text = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				//Get left section floor count
				$explodedCount = explode(" ", $text->getText());
				$leftFloorCount = $explodedCount[0];
				//Get Right section Building Count
				$rightFloor = $this->webDriver->findElements(WebDriverBy::{$locatorName}($dataval));
				$rightFloorCount = count($rightFloor);
				if ($leftFloorCount == $rightFloorCount) {
					$steps->result_status = 1;

					$status = 1;
				} else {
					$steps->result_status = 0;

					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;
			
		//TO CHECK SLIDER ACTION
		case 'Slider':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$inputData = $dataval;
				$action = new WebDriverActions($this->webDriver);
				$action->dragAndDropBy($element, intval($inputData), 0)->perform();
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//TO CHECK IMAGE COUNT INSIDE SVG
		case 'ImageCount':
			try {
				$steps->executed_status = 1;
				$testCount = $this->webDriver->executeScript('var x = document.getElementsByTagName("circle");
                                        var i;
                                        var count=0;
                                        for (i = 0; i < x.length; i++) {

                                            if(x[i].style.display==""){
                                                count++;
                                            }
                                        }return count'
				);
				$steps->result_status = 1;

				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK BARCHART TOOLTIP DATA
		case 'BarchartTooltip':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$toolTipValue = $element->getAttribute('aria-label');
				$tooltipPercentageValue = explode(" ", $toolTipValue);
				if ($tooltipPercentageValue[5] >= 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK FIRST DATA PRESENCE
		case 'Check FirstElement presence':
			//GET FIRST ELEMENT
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$firstElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if (count($firstElement) > 0) {
					$GLOBALS['firstElementText'] = $firstElement->getText();
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK SECOND DATA PRESENSE
		case 'Check secondElement presence':
			//GET SECOND ELEMENT
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$secondElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$data = (string) $dataval;
				if ($secondElement) {
					if ((strpos(trim($GLOBALS['firstElementText']), trim($data)) !== false)) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK TOOLTIP DATA
		case 'ChartToolTipCheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$actionNew = new WebDriverActions($this->webDriver);
				$elementtest = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if (count($elementtest) > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO GET BUILDING COUNT
		case 'CheckBuildingCount':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$buildingCountObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->getText();
				$buildingCountArray = explode(" ", $buildingCountObj);
				$GLOBALS['buildingCount'] = $buildingCountArray[0];
				if ($GLOBALS['buildingCount'] > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK WITH FIRST BUILDING COUNT(GLOBAL DATA)
		case 'ChecksecondBuildingCount':
			//GET SECOND ELEMENT
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$secondElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));

				if (count($secondElement) == $GLOBALS['buildingCount']) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK ELEMENT IS PRESENT
		case 'ElementPresence':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$elementExist = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($elementExist) > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK GIVEN TIME IS EQUAL
		case 'TimeCheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$timeElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$timeElementArray = $timeElement->getText();
				if (!strcmp($timeElementArray, $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'WaitUntillChartData':
			try {
				$steps->executed_status = 1;
				if ($this->webDriver->wait(30, 200)->until(
					WebDriverExpectedCondition::visibilityOf(WebDriverBy::{$locatorName}($xPathGen))
				)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//WAIT UNTILL LOGIN PAGE ELEMENT IS VISIBLE
		case 'WaitUntillLogin':
			try {
				$steps->executed_status = 1;
				if ($this->webDriver->wait(300, 500)->until(
					WebDriverExpectedCondition::visibilityOfElementLocated(WebDriverBy::{$locatorName}($xPathGen))
				)) {
					//$this->insertResults($row['testschedularid'], $row['testsuiteid'], $row['id'],$timestamp,$screenshot_name);
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK CATEGORY AVERAGE UTILIZATION
		case 'CategoryCheckAvgUtilization':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$categoryElementExist = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($categoryElementExist) > 0) {
					$categoryCount = count($categoryElementExist) - 1;
					if ($categoryCount == 5) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK TOOL TIP DATA OF AVERAGE UTILIZATION WHILE MOUSE OVER
		case 'MouseOverAvgUtilization':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}("/html/body/div[3]/p[1]"));
				$legendElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$tooltipText = $tooltipElement->getText();
				$legendText = $legendElement->getText();
				if (!strcmp($tooltipText, $legendText)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK LEGEND PERCENTAGE IS EQUAL TO Y AXIS DATA
		case 'CheckLegendPercentage':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$legendPercentageElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				$actionhover->moveToElement($legendPercentageElement)->perform();
				$text = $legendPercentageElement->getAttribute('title');
				$explodeText = explode(" ", $text);
				$percentage = substr($explodeText[3], 0, -1);
				if ($percentage != "NaN") {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//SWITCH TO TAB ACTION
		case 'SwitchToTab':
			try {
				$steps->executed_status = 1;
				$handles = $this->webDriver->getWindowHandles();
				if (count($handles) > 0) {
					$focusWin = count($handles) - 1;
				}
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				//$this->webDriver->close();
				$this->webDriver->switchTo()->window($handles[$focusWin]);
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$steps->result_status = 1;

				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK UTILIZATION PERCENTAGE CHECK
		case 'CheckUtilizationPercentage':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$utilizationPercentageElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$utilizationPercentage = substr($utilizationPercentageElement->getText(), 0, -1);
				//check utilization percentage should not be 0
				if ($utilizationPercentage != 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK ARROW ICON PRESNECE FOR BUILDING
		case 'ArrowIconPresence':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$elementExist = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($elementExist) == 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK USAGE TREND TOOLTIP
		case 'UsageTrendTooltip':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				$tooltipText = $tooltipElement->getText();
				if ($tooltipText) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK MOUSE OVER AVERAGE HOURS
		case 'MouseOverAvgHours':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));

				$tooltipText = $dataval;
				$legendText = $dataval;
				if (!strcmp($tooltipText, $legendText)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK CHECKED DATA IS PRESENT IN ANOTHER PAGE
		case 'ActiveElementcheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$this->webDriver->executeScript('var items = document.getElementsByClassName("md-button ng-scope md-ink-ripple active");
                    var days=[];
                    var storedNames=[];
                    for (var i = 0; i < items.length; i++){
                        days.push(items[i].textContent);}
                        localStorage.setItem("days", JSON.stringify(days));
                        var storedNames = JSON.parse(localStorage.getItem("days"));             ');
				$steps->result_status = 1;

				$status = 1;

			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'MatchActiveElement':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$this->webDriver->executeScript('var checkedValue = [];
                    var inputElements = document.getElementsByClassName("ng-scope md-checkbox-enabled md-ink-ripple");
                    for(var i=0;inputElements[i]; ++i){
                        var se=document.getElementsByClassName("ng-scope md-checkbox-enabled md-ink-ripple")[i].getAttribute("aria-selected");
                        if(se =="true"){
                            var da=document.getElementsByClassName("ng-scope md-checkbox-enabled md-ink-ripple")[i].getAttribute("value");
                            checkedValue.push(da);
                            se="false";
                        };
                    }
                    var storedNames = JSON.parse(localStorage.getItem("days"));
                    if(storedNames=checkedValue){
                        return true;
                    }
                    else{
                        return false;
                    }');
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		//TO CHECK VERSION EQUALS
		case 'VersionEquals':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$getText = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->getText();
				$getVersion = explode("|", $getText);

				if (!strcmp(trim($getVersion[1]), $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CLEAR INPUT VALUE
		case 'Clear':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$clearElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$clearElement->clear();
				$steps->result_status = 1;
				$status = 1;

			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK RADIO BUTTON IS ENABLE OR DISABLE
		case 'RadioButtonEnable':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				//check attribute wheather the button is enable or not
				$enabled = $element->getAttribute('aria-checked');

				if ($enabled == "true") {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}

			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK WHETHER INPUT IS EMPTY OR NOT
		case 'CheckInputValue':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$value = $element->getAttribute('value');

				if (empty($value)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK GIVEN TEXT IS PRESENT UNDER WIDGET
		case 'CheckTextUnderWidget':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$elementcheck = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if ($elementcheck) {
					$textElementXpath = $xPathGen . "/button/span/div/span[2]";
					$textObj = $elementcheck->findElement(WebDriverBy::{$locatorName}($textElementXpath));

					//get element to compare text
					$textDetails = $textObj->getText();
					$text = trim($textDetails);

					//get given text
					$givenText = trim($dataval);

					//compare given text with text from element
					if (!strcmp($text, $givenText)) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//SAVE IMAGE ACTION
		case 'SaveImage':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				sleep(4);
				$action2 = new WebDriverActions($this->webDriver);
				//To perform right click
				$action2->keyDown(WebDriverKeys::CONTROL)
					->sendKeys("s")
					->perform();
				$steps->result_status = 1;
				$status = 1;

			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK BUTTON DISABLE ACTION
		case 'ButtonDisable':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$buttonElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if ($buttonElement->isEnabled()) {
					$steps->result_status = 0;
					$status = 0;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CLOSE WINDOW
		case 'Windowclose':
			try {
				$steps->executed_status = 1;
				$this->webDriver->quit();
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO INVOKE NEW WINDOW
		case 'InvokeNewWindow':
			try {
				$steps->executed_status = 1;
				$this->CustomSetUpChrome();
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK UTILIZATION CATEGORY TOOLTIP NAME
		case 'UtilizationByDepartmentTooltipName':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				//check tooltip is exist
				$tooltipText = $tooltipElement->getText();
				if ($tooltipText) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK UTILIZATION CATEGORY TOOLTIP PERCENTAGE
		case 'UtilizationByDepartmentPercentage':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				$tooltipText = $tooltipElement->getText();
				$tooltipPercentageValue = explode(":", $tooltipText);
				$tooltipPercentage = trim(intval($tooltipPercentageValue[1]));

				if ($tooltipPercentage > 100) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK UTILIZATION CATEGORY LEGEND TOOLTIP PERCENTAGE
		case 'LegendUtilizationByDepartmentPercentage':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();

				$tooltipText = $hoverElement->getAttribute('title');
				$tooltipPercentageValue = explode(" ", $tooltipText);
				$tooltipPercentage = trim(intval($tooltipPercentageValue[2]));

				if ($tooltipPercentage > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//Verify the Utilization by Department widget
		case 'SpaceCategorywidgetPercentageCheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$averageValue = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$averagePercentage = $averageValue->getText();
				$averagePercentageString = strval($averagePercentage);
				if (strpos($averagePercentageString, "%") !== false) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO VERIFY BUSIEST TIME SLOT WIDGET
		case 'BusiestTimeSlots':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$categoryObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$categoryCount = count($categoryObj);

				$busiestTimeSlotColumnObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($dataval));
				$busiestTimeSlotColumnCount = count($busiestTimeSlotColumnObj) - 1;

				if ($busiestTimeSlotColumnCount == $categoryCount) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK BUSIEST TIME SLOT ROW
		case 'CheckBusiestTimeSlotsRow':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$busiestTimeSlotRowObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$busiestTimeSlotRowCount = count($busiestTimeSlotRowObj);
				if ($busiestTimeSlotRowCount == 10) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK COLOR VARIATION WITH ITS GIVEN COLOR
		case 'Color':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$colorObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$style = $colorObj->getAttribute('style');
				$colorCode = explode(":", $style);
				$getColorArray = trim($colorCode[1]);
				$getColor = explode(";", $getColorArray);
				$getFinalColor = strval(trim($getColor[0]));

				//DEFINE COLOR ARRAY
				$colorArray = array("yellow" => "rgb(255, 195, 26)", "red" => "rgb(234, 0, 13)", "amber" => "rgb(255, 141, 9)");

				//GET CATEGORY TEXT
				$getCategoryObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				//GET COLOR TEXT
				$getXpath = $xPathGen . "/span";

				//GET TIMESLOT OBJECT
				$getTimeSlotColoumnObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($getXpath));
				$timeSlotText = $getTimeSlotColoumnObj->getText();
				$categoryText = $getCategoryObj->getText();

				//COLOR CALCULATION
				$colorRange = intval(($timeSlotText / $categoryText) * 100);

				//GET COLOR
				if ($colorRange <= 25) {
					$colorValue = "red";
				} elseif (($colorRange > 25) && ($colorRange < 75)) {
					$colorValue = "amber";
				} else {
					$colorValue = "yellow";
				}

				$getColorValue = strval(trim($colorArray[$colorValue]));

				//color comparision
				if (!strcmp($getColorValue, $getFinalColor)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY PIE CHART SUM IS 100%
		case 'PiechartCollectiveSum':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				for ($i = 1; $i <= 5; $i++) {
					$getXpath = $xPathGen . "[$i]";
					$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($getXpath));
					$textContains = $hoverElement->getAttribute('class');
					$specificStringToSearch = "c3-target-DATA-UNAVAILABLE";
					if (strpos($textContains, $specificStringToSearch) == false) {

						$actionhover = new WebDriverActions($this->webDriver);
						//mouseover to selected tooltip
						$actionhover->moveToElement($hoverElement)->perform();
						$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

						$tooltipText = $tooltipElement->getText();
						$tooltipPercentageValue = explode("(", $tooltipText);
						$tooltipTotal[] = intval($tooltipPercentageValue[1]);
					}
				}

				$total = array_sum($tooltipTotal);
				$totalPercentage = $total;
				if ($totalPercentage == 100) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY PIE CHART SUM IS 100%
		case 'PiechartPercentageCheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				$tooltipText = $tooltipElement->getText();
				$tooltipPercentageValue = explode("(", $tooltipText);
				$tooltipTotal = intval($tooltipPercentageValue[1]);

				if ($tooltipTotal) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY FLOOR TEXT IS DISPLAYING
		case 'CheckFloorTextPresence':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				if ($this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen))) {
					$textElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
					$floorText = $textElement->getText();
					$actualText = "Please select a floor";
					if (!strcmp($floorText, $actualText)) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY BUILDING WITH AVERAGE PEAK UTILIZATION
		case 'BuildingWithAvgPeakUtilizationCheck':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$averageValue = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$averagePercentage = $averageValue->getText();
				$averagePercentageString = strval($averagePercentage);
				$percentage = intval($averagePercentage);
				if ((strpos($averagePercentageString, "%") !== false) && ($percentage != "NaN") && !empty($percentage)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK INPUT DATA IS EQUAL WITH GIVEN DATA
		case 'CheckInputDataEquals':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$value = $element->getAttribute('value');

				if (!strcmp($value, $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
				$logs = $this->recordErrorLog($steps, $captureErrorLog);
				$captureErrorLog = true;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET DATA FROM JQUERY INPUT BOX AND CHECK VALUE
		case 'CheckJequeryInputDataEquals':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				if ($locatorName == "cssSelector") {
					$this->webDriver->executeScript('var text=angular.element(document.querySelector("' . $xPathGen . '").valu();
					return text;');
				} else if($locatorName=="id") {

					$this->webDriver->executeScript('var text=angular.element(document.getElementById("' . $xPathGen . '").val());
					return text;');
				}else if($locatorName=="xpath"){
					$this->webDriver->executeScript('var text=angular.element(document.evaluate("'.$xPathGen.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.val());
					return text;');
				}else{
					$text = $this->webDriver->executeScript('
						var text=angular.element(document.getElementsByClassName("' . $xPathGen . '")[0]).val();
						return text;');
				}
					
				$value = trim($text);

				if (!strcmp($value, $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK ROW IS HIGHLIGHTED
		case 'CheckRowHighlighted':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to table row
				$actionhover->moveToElement($hoverElement)->perform();

				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$getbackgroundColor = $element->getCSSValue('background-color');

				if (!strcmp($getbackgroundColor, $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK FLOATING POINT PRECISION
		case 'CheckSingleFloatingPointPrecision':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$flotingpointObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$flotingpointText = $flotingpointObj->getText();
				if ($flotingpointText !== "NAN") {
					$averagePercentageString = explode(".", $flotingpointText);
					$floatingValue = explode("%", $averagePercentageString[1]);
					$stringLength = strlen($floatingValue[0]);
					if (($stringLength == 1)) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK GRAPH DATA IS STARTED FROM XY INTERSECTION POINT
		case 'CheckGraphStartingPoint':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$graphDataObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$graphData = explode(",", $graphDataObj->getAttribute('d'));
				$graphPoint = $graphData[0];
				//To get second position of string
				$data = $graphPoint[1];
				if (($data == 0)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'CheckCustomizationReportInputValue':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$value = $element->getAttribute('placeholder');

				if (!strcmp($value, $dataval)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY ORGANIZATION LATITUDE AND LONGTITUDE
		case 'CheckOrganizationLatitudeAndLongtitude':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				//TO GET ORGANIZATION LATITUDE VALUE
				$GLOBALS['lattitudeValue'] = $this->webDriver->executeScript('
                    var lattitude=angular.element(document.getElementsByClassName("' . $xPathGen . '")[0]).val();
                    return lattitude;');

				//TO GET ORGANIZATION LONGTITUDE VALUE
				$GLOBALS['longtitudeValue'] = $this->webDriver->executeScript('
                    var longtitude=angular.element(document.getElementsByClassName("' . $xPathGen . '")[1]).val();
                    return longtitude;');

				$steps->result_status = 1;

				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY GOOGLE MAP LATITUDE
		case 'CheckGoogleMapLatitude':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$googleMapLatitudeElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$getValue = $googleMapLatitudeElement->getAttribute('value');
				$getExplodeValue = explode(",", $getValue);
				$latitude = trim(strval($getExplodeValue[0]));

				if (!strcmp($GLOBALS['lattitudeValue'], $latitude)) {
					$steps->result_status = 1;

					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY GOOGLE MAP LONGTITUDE
		case 'CheckGoogleMapLongtitude':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$googleMapLongtitudeElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));

				$getValue = $googleMapLongtitudeElement->getAttribute('value');
				$getExplodeValue = explode(",", $getValue);
				$longtitude = trim(strval($getExplodeValue[1]));

				if (!strcmp($GLOBALS['longtitudeValue'], $longtitude)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK GIVEN DATA IS IN DROPDOWN
		case 'CheckTextinDropdown':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$dropdownObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$i = 0;
				foreach ($dropdownObj as $dropdownArray) {
					$data = trim($dropdownArray->getText());
					$givenData = trim($dataval);
					if (!strcmp($givenData, $data)) {
						$i++;
					}
				}

				if ($i > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET SLIDER TIME FROM FILTER
		case 'GetSliderTime':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				//Get start time from slider
				$getStartTimeObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['start_time'] = str_replace(' ', '', $getStartTimeObj->getText());

				//Get end time from slider
				$getEndTimeObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$GLOBALS['end_time'] = str_replace(' ', '', $getEndTimeObj->getText());
				$steps->result_status = 1;

				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK TIME DISPLAY TIME WITH SLIDER TIME IN FILTER
		case 'CheckSliderTimewithDisplayTime':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$getDisplayTimeObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$time = str_replace(' ', '', $getDisplayTimeObj->getText());

				//Split start time and end time
				$data = explode('-', $time);
				$startTime = $data[0];
				$endTime = $data[1];

				if ((!strcmp($startTime, $GLOBALS['start_time'])) && (!strcmp($endTime, $GLOBALS['end_time']))) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK BUILDING TEXT DOES NOT EXIST AFTER CACHE CLEAR
		case 'CheckBuildingNameReset':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$buildingObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($buildingObj) == 1) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK TOOLTIP TEXT EXIST
		case 'CheckTooltipExist':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$tootipObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$tooltipText = $tootipObj->getAttribute('title');
				if (!empty($tooltipText)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK DOT PRESENT FOR PERIOD USAGE GRAPH WHEN SINGLE DAY IS SELECTED
		case 'CheckPeriodUsageDotPresence':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$i = 0;
				$elementsObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				foreach ($elementsObj as $elementObj) {
					if ($elementObj->isDisplayed()) {
						$i++;
					}
				}
				if ($i == 1) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY CATEGORY RANGE SHOULD BE LESS THAN OR EQUAL TO 4 IN CONFERENCE ROOM ANALYSIS PAGE
		case 'CheckCategoryCount':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$categoryObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($categoryObj) <= 4) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//OPEN NEW TAB
		case 'OpenNewTab':
			try {
				$steps->executed_status = 1;
				$this->webDriver->executeScript(
					'window.open("' . $dataval . '", "_blank");
                    ');
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
				$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
				$captureErrorLog = true;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CLOSE CURRENT TAB
		case 'CloseTab':
			try {
				$steps->executed_status = 1;
				$handles = $this->webDriver->getWindowHandles();
				if (count($handles) > 0) {
					$focusWin = count($handles) - 1;
				}
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$this->webDriver->close();
				$this->webDriver->switchTo()->window($handles[$focusWin]);
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
				$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
				$captureErrorLog = true;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK MOUSE OVER ELEMENT BACKGROUND COLOR
		case 'MouseOverHoursDuringUser':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionhover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionhover->moveToElement($hoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$style = $tooltipElement->getAttribute('style');
				$getBackgroundColor = explode(":", $style);
				$value = trim($getBackgroundColor[1]);
				$GLOBALS['getHoursDuringUserColor'] = rtrim($value, ";");

				if ($GLOBALS['getHoursDuringUserColor']) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK MOUSE OVER ELEMENT BACKGROUND COLOR WITH ICON BACKGROUND COLOR
		case 'CheckColorWithTooltipColor':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$iconElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$style = $iconElement->getAttribute('style');
				$getBackgroundColor = explode(":", $style);
				$value = trim($getBackgroundColor[1]);
				$color = rtrim($value, ";");
				$explodeValue = explode(";", $color);
				$finalColor = trim($explodeValue[0]);

				if (!strcmp($GLOBALS['getHoursDuringUserColor'], $finalColor)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK TOGGLE BUTTON IS DISABLE
		case 'CheckToggleButtonDisable':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$toggleElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				//get attribute detail to check button is disable
				$disable = $toggleElement->getAttribute('aria-disabled');
				if ($disable == "true") {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY OPACITY VARIATION BY CHANGING SLIDER INPUT
		case 'VerifyOpacityVariation':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$opacityElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));

				//Get opacity value to verify changes is happening
				$getOpacity = trim($opacityElement->getCssValue('opacity'));
				if (!strcmp($getOpacity, $dataval)) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY COLOR VARIATION BY CHANGING SLIDER INPUT
		case 'VerifyColorVariation':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$colorElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));

				//Get opacity value to verify changes is happening
				$getColor = trim($colorElement->getCssValue('fill'));
				if (!strcmp($getColor, trim($dataval))) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//VERIFY PAGE LOAD TIME SHOULD NOT EXCEED GIVEN TIME
		case 'CheckPageLoadingTime':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				if ($this->webDriver->wait($dataval, 4)->until(
					WebDriverExpectedCondition::visibilityOfElementLocated(WebDriverBy::{$locatorName}($xPathGen))
				)) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET CONFERENCE ROOM CATEGORY DETAILS
		case 'GetConferenceRoomCategoryDetails':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$categoryObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['categoryCountObj'] = $categoryObj;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK PIECHART CONFERENCE ROOM CATEGORY DETAILS
		case 'CheckPieChartConferenceRoomCategoryDetails':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$pieChartDropdownElementObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$pieChartDropdownElementTotalCount = count($pieChartDropdownElementObj);
				$pieChartDropdownElementCount = $pieChartDropdownElementTotalCount - 1;
				$globalCategoryObj = $GLOBALS['categoryCountObj'];

				//check dropdown count and category count is equal
				if (count($globalCategoryObj) == $pieChartDropdownElementCount) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET COLOR FROM LEGEND
		case 'GetPiechartLegendColor':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$colorElementObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['pieChartLegendColor'] = trim($colorElementObj->getCssValue('color'));
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK PIECHART LEGEND COLOR WITH ITS DESCRIPTION
		case 'CheckPiechartLegendColorWithDescription':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$colorDescriptionElementObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$pieChartLegendColorDescription = trim($colorDescriptionElementObj->getText());
				$givenData = trim($dataval);
				$explodedData = explode("-", $givenData);

				//getColor
				$colorData = $explodedData[0];
				//getDescription
				$descriptionData = $explodedData[1];

				//check both color and description with given data
				if ((!strcmp($colorData, $GLOBALS['pieChartLegendColor'])) && (!strcmp($descriptionData, $pieChartLegendColorDescription))) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'UtilizationSettingsData':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$utilizationSettingsDataObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['utilizationSettingsData'] = trim($utilizationSettingsDataObj->getAttribute('value'));
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK DATA IN UTILIZATION MAP MOUSE OVER
		case 'UtilizationMapMouseOver':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$utilizationMaHoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$actionUtilizationMaphover = new WebDriverActions($this->webDriver);
				//mouseover to selected tooltip
				$actionUtilizationMaphover->moveToElement($utilizationMaHoverElement)->perform();
				$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				$utilizationTooltipOverallPercentage = intval($tooltipElement->getText());
				if ($utilizationTooltipOverallPercentage <= $GLOBALS['utilizationSettingsData']) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK ELEMENT IS NOT PRESENT
		case 'ElementNotPresent':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if ($element) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//TO CHECK CSV DOWNLOADED DATA IS EQUAL
		case 'CheckDataFromFile':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				//GET PAGE DETAILS
				$xpath = $xPathGen;

				$tableElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));

				$i = 1;
				$tableText = array();
				foreach ($tableElements as $tableElement) {
					$xpathElements = $xPathGen . "[" . $i . "]" . "/span";
					$textElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xpathElements));

					$tableText = array();
					if (count($textElements) > 0) {
						foreach ($textElements as $textElement) {

							//read content and change data into common format
							if (strpos($textElement->getText(), "%") !== false) {

								$replacementText = str_replace("%", "", $textElement->getText());
							} else {
								$replacementText = $textElement->getText();
							}

							if (is_numeric($replacementText)) {
								$changedText = $replacementText + 0;
							} else {
								$changedText = $replacementText;
							}
							$tableText[] = $changedText;
						}
					}

					//get total of text element
					$totalTextElement[] = $tableText;
					$i++;
				}

				//GET CSV DETAILS
				$givenDownloadPath = $dataval;
				$pathDetails = $givenDownloadPath . "*.csv";
				$dir = glob($pathDetails);
				//logic to get final downloaded file count
				$directroyCount = count($dir) - 1;

				//read content from last downloaded csv file from given path
				$file = fopen($givenDownloadPath . " (" . $directroyCount . ").csv", "r");
				//GET ARRAY OF TABLE
				$text = array();
				$csvTextArray = array();
				fgetcsv($file, 10000, ",");
				while (!feof($file)) {
					$text = fgetcsv($file);

					if (!empty($text[0])) {
						$excelTextValue = array();
						for ($tcount = 0; $tcount <= count($text) - 1; $tcount++) {

							//read content and change data into common format
							if (strpos($text[$tcount], "%") !== false) {

								$replacementExcelText = str_replace("%", "", $text[$tcount]);
							} else {
								$replacementExcelText = $text[$tcount];
							}
							if (is_numeric($replacementExcelText)) {
								$changedExcelText = $replacementExcelText + 0;
							} else {
								$changedExcelText = $replacementExcelText;
							}
							$excelTextValue[] = $changedExcelText;
						}
						$csvTextArray[] = $excelTextValue;
					}
				}

				$dataCount = 0;
				if (count($totalTextElement) == count($csvTextArray)) {

					$totalCount = count($totalTextElement) - 1;

					for ($i = 0; $i <= $totalCount; $i++) {
						//final array of data from page
						$array1 = $totalTextElement[$i];
						//final array of data from file
						$array2 = $csvTextArray[$i];
						//check differnce in file and page
						$countValue = array_diff($totalTextElement[0], $csvTextArray[0]);

						if (count($countValue) == 0) {

						} else {
							$dataCount++;
						}
					}

					if ($dataCount > 0) {
						$steps->result_status = 0;
						$status = 0;
					} else {
						$steps->result_status = 1;

						$status = 1;
					}
				} else {
					$steps->result_status = 0;
					$status = 0;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
				}
				fclose($file);
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//SWITCH TO WINDOW
		case 'SwitchToWindow':
			try {
				$steps->executed_status = 1;
				sleep(2);
				$handles = $this->webDriver->getWindowHandles();
				$this->webDriver->switchTo()->window(
					$handles[2]
				);
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
				$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
				$captureErrorLog = true;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CLOSE PRINT WINDOW
		case 'ClosePrintWindow':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);
				sleep(3);
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::ESCAPE);
				$action = new WebDriverActions($this->webDriver);
				$action->sendKeys(NULL, WebDriverKeys::ESCAPE)->perform();
				$steps->result_status = 1;

				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK SEQUENCE OF GIVEN ELEMENT
		case 'CheckSequence':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$childElement = $parentElement->findElements(WebDriverBy::tagName("li"));
				if (count($childElement) > 0) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET CURRENT PAGE DETAILS
		case 'GetDetailsBeforePrint':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$xpath = $xPathGen;
				$printCurrentPageElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$i = 1;
				$currentPrintPageText = array();
				foreach ($printCurrentPageElements as $printCurrentPageElement) {
					$xpathElements = $xPathGen . "[" . $i . "]" . "/span";
					$printDataElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xpathElements));

					$tableText = array();
					if (count($printDataElements) > 0) {
						foreach ($printDataElements as $printDataElement) {

							if (strpos($printDataElement->getText(), "%") !== false) {
								$changedText = str_replace("%", "", $printDataElement->getText());
							} else {
								$changedText = $printDataElement->getText();
							}

							$currentPrintPageText[] = $changedText;
						}
					}

					//get total of text element
					$currentPrintPageData[] = $currentPrintPageText;
					$i++;
				}
				$GLOBALS['currentPrintPageArray'] = $currentPrintPageData;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK DETAILS WITH PRINT PAGE
		case 'CheckDetailsWithPrintWindow':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$currentWindowDetails = $GLOBALS['currentPrintPageArray'];

				$xpath = $xPathGen;
				$printPageElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				//REMOVE HEADING FROM PRINTIN PAGE
				$printPageCount = count($printPageElements) - 1;
				$printPageText = array();

				if ($printPageCount == count($currentWindowDetails)) {
					$i = 2;
					$PrintPageData = array();
					foreach ($currentWindowDetails as $printPageElement) {
						$printXpath = $xPathGen . "[" . $i . "]" . "/td";

						$printPageDataElements = $this->webDriver->findElements(WebDriverBy::{$locatorName}($printXpath));
						$tableText = array();
						if (count($printPageDataElements) > 0) {
							foreach ($printPageDataElements as $printPageDataElement) {

								$changedText = $printPageDataElement->getText();

								$printPageText[] = $changedText;
							}
						}

						//get total of text element
						$printPageData[] = $printPageText;
						$i++;
					}

					//Compare both page
					if (count($printPageData) == count($currentWindowDetails)) {
						$totalCount = count($currentWindowDetails) - 1;
						$printDataCount = 0;
						$difference = array();
						for ($j = 0; $j <= $totalCount; $j++) {
							$array1 = $printPageData[$j];
							$array2 = $currentWindowDetails[$j];
							$difference = array();
							//$countValue = array_diff($totalTextElement[0], $csvTextArray[0]);
							foreach ($array1 as $key => $value) {

								if (is_array($value)) {
									if (!isset($array2[$key])) {
										$difference[$key] = $value;
									} elseif (!is_array($array2[$key])) {
										$difference[$key] = $value;
									} else {
										$new_diff = array_diff_assoc_recursive($value, $array2[$key]);
										if ($new_diff != FALSE) {
											$difference[$key] = $new_diff;
										}
									}
								} elseif (!isset($array2[$key]) || $array2[$key] != $value) {
									$difference[$key] = $value;
								}
							}

							if (count($difference) == 0) {

							} else {
								$printDataCount++;
							}
						}

						if ($printDataCount > 0) {
							$steps->result_status = 0;
							$status = 0;
						} else {
							$steps->result_status = 1;

							$status = 1;
						}
					}
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET SPACE CONFIGURATION BUILDING TREE DETAILS
		case 'GetSpaceConfigBuildingTreeDetails':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				//Get building details
				$getBuildingObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$getBuildingTextObj = $getBuildingObj->findElement(WebDriverBy::tagName('button'));
				$buildingName = $getBuildingTextObj->getText();

				//Get floor details of building
				$getFloorsObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($dataval));

				$i = 1;
				$floors = array();
				foreach ($getFloorsObj as $getFloorsArray) {
					$floorXpath = $dataval . "[" . $i . "]";
					$getFloorsObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($floorXpath));
					$getFloorsTextObj = $getFloorsObj->findElement(WebDriverBy::tagName('button'));
					$floors[] = $getFloorsTextObj->getText();
					$i++;
				}
				$totalFloors[$buildingName] = $floors;
				$GLOBALS['spaceConfigBuildingTreeDetails'] = $totalFloors;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK BUILDING DETAILS PAGE IN FACILITY SPACE CONFIGURATION EDITOR WITH FACILITY MANAGEMTNT PAGE
		case 'CheckFacilityManagementBuildingTreeDetails':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$getFacilityBuildingObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$getFacilityBuildingTextObj = $getFacilityBuildingObj->findElement(WebDriverBy::tagName('button'));
				$facilityBuildingName = $getFacilityBuildingTextObj->getText();
				$spaceConfigDetails = $GLOBALS['spaceConfigBuildingTreeDetails'];
				//GET SPACE CONFIGURATION TREE DETAILS
				foreach ($spaceConfigDetails as $keyData => $value) {
					$spaceConfigBuildingName = $keyData;
					$spaceConfigFloorDetails = $value;
				}
				//Get floor details of building
				$getFacilityFloorsObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($dataval));

				if ((count($spaceConfigFloorDetails) == count($getFacilityFloorsObj)) && (!strcmp(trim($facilityBuildingName), trim($facilityBuildingName)))) {
					$j = 1;
					$facilityFloors = array();
					foreach ($getFacilityFloorsObj as $getFacilityFloorsArray) {
						$facilityFloorXpath = $dataval . "[" . $j . "]";
						$getFacilityFloorsObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($facilityFloorXpath));
						$getFacilityFloorsTextObj = $getFacilityFloorsObj->findElement(WebDriverBy::tagName('button'));
						$facilityFloors[] = $getFacilityFloorsTextObj->getText();
						$j++;
					}
					$arrayDiff = array_diff($facilityFloors, $spaceConfigFloorDetails);
					if (count($arrayDiff) == 0) {
						$steps->result_status = 1;
						$status = 1;
					} else {
						$steps->result_status = 0;
						$status = 0;
					}
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//GET TIME RANGE TO SET GLOBAL
		case 'CheckTimeRange':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$timeRangeElementObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$totalTimeRange = $timeRangeElementObj->getText();
				$timeExplode = explode("-", $totalTimeRange);

				//GET START TIME AND END TIME FROM TIME RANGE FILTERED
				$startTimeExplode = trim($timeExplode[0]);
				$endDateExplode = trim($timeExplode[1]);

				$GLOBALS['startTime'] = DateTime::createFromFormat('H:i a', $startTimeExplode);
				$GLOBALS['endTime'] = DateTime::createFromFormat('H:i a', $endDateExplode);
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//CHECK USAGE TREND TIME WIDGET
		case 'UsageTrendTimeMouseOver':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				sleep(2);
				$getBarChartObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$getBarCount = count($getBarChartObj);
				for ($j = 1; $j <= 5; $j++) {

					for ($i = 1; $i <= $getBarCount; $i++) {
						$xpathDetails = $xPathGen . "[" . $i . "]" . "/*[name()='g']/*[name()='path']" . "[" . $j . "]";
						if ($this->webDriver->findElement(WebDriverBy::{$locatorName}($xpathDetails))->isDisplayed()) {
							$hoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xpathDetails));
							$actionhover = new WebDriverActions($this->webDriver);

							//mouseover to selected tooltip
							$actionhover->moveToElement($hoverElement)->perform();

							//get tooltip text
							$tooltipFullXpath = explode("div", $dataval, 3);
							$tootipVisibilityXpath = $tooltipFullXpath[0] . "div";
							$tooltipContainer = $this->webDriver->findElement(WebDriverBy::{$locatorName}($tootipVisibilityXpath));
							$cssValue = $tooltipContainer->getCssValue('display');

							if ($cssValue != "none") {

								$tooltipElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

								$tooltipData = str_replace(" ", ":00 ", $tooltipElement->getText());
								$tooltipTime = DateTime::createFromFormat('H:i a', $tooltipData);
								if (($tooltipTime >= $GLOBALS['startTime']) && ($tooltipTime <= $GLOBALS['endTime'])) {

								} else {
									$dateCount = 1;
								}
							}
						}
					}
				}
				if (isset($dateCount)) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//WAIT UNTILL POPUP CLOSE
		case 'WaitUntillPopupClose':
			try {
				$steps->executed_status = 1;
				sleep($dataval);
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
				$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
				$captureErrorLog = true;
			}
			break;

		case 'Paginationclick':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$i = 4;
				$getBarChartObj = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));

				while ($getBarChartObj->isEnabled()) {
					$givenXpath = $xPathGen . "[" . $i . "]" . "/a";
					$clickElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($givenXpath));
					$clickElement->click();
					$this->webDriver->executeScript('element = document.querySelector("#datatables_paginate");
                       element.scrollIntoView(true);');
					sleep(9);

					$i++;
				}
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case "CheckRowCount":
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$getAllRowCount = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$getTotalRowCount = count($getAllRowCount) - 2;
				if ($dataval == $getTotalRowCount) {
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'ClickAlert':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				$confirmBtn = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$confirmBtn->click();
				$this->webDriver->switchTo()->alert()->accept();
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'GetOrderDetail':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$searchElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$getOrderId = substr($searchElement->getText(), 4, 8);
				$GLOBALS['searchText'] = trim($getOrderId);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

			case 'ClickOnAlertPopup':
			try
			{
				$steps->executed_status = 1;
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click();
				$test_var=1;
				$steps->result_status = 1;
				$status = 1;
				sleep(4);
				if($dataval=='ok')
				{
				$this->webDriver->switchTo()->alert()->accept();	
				}
				if($dataval=='cancel')
				{
					
					$this->webDriver->switchTo()->alert()->dismiss();	
				}
				

			}
			catch(\Exception $e)
			{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;

			}
			finally{

				if ($status == 0) {
					
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$this->webDriver->quit();
				}

			}
			break;

		case 'GotoObjectHtml':
		try{
			$steps->executed_status = 1;
			$my_frame=$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
			//$my_frame = $this->webDriver->findElement(WebDriverBy::xpath('//*[@id="panelcontentobject"]'));
			$this->webDriver->switchTo()->frame($my_frame);
			sleep(3);
			
			$steps->result_status = 1;
			$status = 1;
		}catch(\Exception $e)
		{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;

		}finally{
			if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}

		}
		break;

		case 'GotoDefaultHtml':
		try{
			$steps->executed_status = 1;
			$this->webDriver->switchTo()->defaultContent();
			sleep(3);
			
			$steps->result_status = 1;
			$status = 1;
		}catch(\Exception $e)
		{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;

		}finally{
			if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}

		}
		break;

		case 'SearchOrder':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$searchOrder = $GLOBALS['searchText'];
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($searchOrder);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'VerifyProgressColumn':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($searchOrder);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkListPresent':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$elementObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				if (count($elementObj) > 0) {
					$GLOBALS['list'] = 1;
				} else {
					$GLOBALS['list'] = 2;
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkAndSelectRoleifListExist':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				if ($GLOBALS['list'] == 2) {
					$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click()->sendKeys($dataval);
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'clickOptionifListExist':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				if ($GLOBALS['list'] == 2) {
					$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click();
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkImplementerCount':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				$elementObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$count = $elementObject->getText();
				if ($count > 0) {
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->result_status = 0;
					$status = 0;
					$steps->executed_status = 0;
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkApprovalProcess':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$elementObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['approvalStatus'] = 1;
				$elementObject->click();
			} catch (\Exception $e) {

			} finally {
				$GLOBALS['approvalStatus'] = 0;
				$editObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$editObject->click();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
				if ($status == 0) {
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'editApprovalProcess':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$elementObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$GLOBALS['approvalStatus'] = 1;
				$elementObject->click();
				$editObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$editObject->click();
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$steps->executed_status = 0;
				$steps->result_status = 1;
				$status = 1;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkDataWithCurrentDate':
			try {
				$currentDate = date("M d");
				$firstElementObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$firstListDateString = $firstElementObject->getText();
				$secondElementObject = $this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval));
				$secondListDateString = $secondElementObject->getText();
				if ((strpos($firstListDateString, $currentDate) !== false) && (strpos($secondListDateString, $currentDate) !== false)) {
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->executed_status = 0;
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$steps->executed_status = 0;
				$steps->result_status = 1;
				$status = 1;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

		case 'PressEnterKey':
			try {
				if ($dataval == "ENTER") {
					$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::ENTER);
				} elseif ($dataval == "TAB") {
					$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);
				} else {
					$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::ESCAPE);
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'DragAndDrop':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(45);
				$draggableElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$myArray = explode(',', $dataval);
				$top = (int) $myArray[0];
				$left = (int) $myArray[1];
				$action = new WebDriverActions($this->webDriver);
				$action->dragAndDropBy($draggableElement, $top, $left)->perform();
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'FlowChartLineDraw':
			try {
				$draggableElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$dropElement = $this->webDriver->findElement(WebDriverBy::cssSelector($dataval));
				$action = new WebDriverActions($this->webDriver);
				$action->dragAndDrop($draggableElement, $dropElement)->perform();
				if ($GLOBALS['browserType'] == 1) {
					$this->webDriver->action()->click($dropElement)->perform();
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'FlowChartRightClick':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(10);
				$imageElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$steps->executed_status = 1;
				$this->webDriver->action()->contextClick($imageElement)->perform();
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'CheckCount':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				$listObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$listCount = count($listObj);
				if ($listCount == $dataval) {
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->executed_status = 1;
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkListData':
			try {
				$listObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				foreach ($listObj as $listText) {
					$text = $listText->getText();
					if (strcmp(trim($text), trim($dataval))) {
						$steps->executed_status = 1;
						$steps->result_status = 0;
						$status = 0;
					} else {
						$steps->executed_status = 1;
						$steps->result_status = 1;
						$status = 1;
						break;
					}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'checkListDataCount':
			try {
				$count = 0;
				$listObj = $this->webDriver->findElements(WebDriverBy::{$locatorName}($xPathGen));
				$getDataval = explode(",", $dataval);
				$givenTextData = $getDataval[0];
				$givenCount = $getDataval[1];

				foreach ($listObj as $listText) {
					$text = $listText->getText();
					if (!strcmp(trim($text), trim($givenTextData))) {
						$count++;
					}
				}
				if ($count == $givenCount) {
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				} else {
					$steps->executed_status = 1;
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'textEdit':
			try {
				if($locatorName == "cssSelector"){
					$this->webDriver->executeScript('element = document.querySelector("' . $steps->objectDetail . '");
					element.innerHTML="' . $dataval . '";');
				} else if($locatorName == "id") {
					//scroll down by Id
					$this->webDriver->executeScript('element = document.getElementById("' . $steps->objectDetail . '");
					element.innerHTML="' . $dataval . '";');
				}else{
					$this->webDriver->executeScript('element = document.evaluate("'.$steps->objectDetail.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					element.innerHTML="' . $dataval . '";');
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;
		case 'setValue':
			try {
				if($locatorName == "cssSelector"){
					$this->webDriver->executeScript('element = document.querySelector("' . $steps->objectDetail . '");
					element.value="' . $dataval . '";');
				} else if($locatorName == "id") {
					//scroll down by Id
					$this->webDriver->executeScript('element = document.getElementById("' . $steps->objectDetail . '");
					element.value="' . $dataval . '";');
				}else{
					// $this->webDriver->executeScript('element = document.evaluate("'.$steps->objectDetail.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					// element.value="' . $dataval . '";');
					$this->webDriver->executeScript("element = document.evaluate('".$steps->objectDetail."', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
					element.value='".$dataval."';");
				}
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		case 'ScrollModal':
			try {
				$id = $steps->data;
				$steps->executed_status = 1;
				if ($locatorName == "cssSelector") {
					$this->webDriver->executeScript('element = document.querySelector("' . $xPathGen . '");
						element.scrollIntoView(true);');
				} else if($locatorName=="id") {

					$this->webDriver->executeScript('element = document.getElementById("' . $id . '");
						element.scrollIntoView(true);');
				}else{
					$this->webDriver->executeScript('element = document.evaluate("'.$xPathGen.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
						element.scrollIntoView(true);');
				}
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$steps->result_status = 0;
				$steps->executed_status = 1;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;



			 //Mouse over for given element
			 case 'Mouseover':
			 try{
					 //Get element
					 $mouseoverElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
			 $mouseoverAction = new WebDriverActions($this->webDriver);
					 //mouse over element
			 $mouseoverAction->moveToElement($mouseoverElement)->perform();
					 $steps->executed_status = 1;
			 $steps->result_status = 1;
			 $status = 1;
					 } catch (\Exception $e) {
				  $steps->result_status = 0;
				  $steps->executed_status = 1;
				  $status = 0;
			} finally {
			  if ($status == 0) {
			  $screenshot_error = $this->readImage($var_screen_image_name);
			  $steps->screenshot_path = $screenshot_error;
			  $final_var = 1;
			  $logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
			  $captureErrorLog = true;
			  //Jira Issue Post 
			  $jiraInfo['summary']    = $steps->stepDesc;
			  $jiraInfo['description'] = $steps->stepDesc;
			  $jiraResultJson = $this->createJiraIssue($jiraInfo);
			  //Jira Issue Post 
			  if($GLOBALS['jiraUserName']){
				$jiraInfo['summary']    = $steps->stepDesc;
				$jiraInfo['description'] = $steps->stepDesc;
				$jiraResultJson = $this->createJiraIssue($jiraInfo);
			}
			  $this->webDriver->quit();
			  }
			 }
  
			break;
  
			case 'LinkTextEquals':
				try{
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$steps->executed_status = 1;
					$result = $this->webDriver->executeScript('
						var objectDetails = "'.$locatorName.'";
						if(objectDetails=="cssSelector"){
							var linkTextData = document.querySelector("'. $xPathGen. '").innerText;
						}else if(objectDetails=="xpath"){
							element = document.evaluate("'.$xPathGen.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
							var linkTextData = element.innerText;
						}else if(objectDetails=="id"){
							var linkTextData = document.getElementById("'.$xPathGen.'").innerText;;
						}
						linkTextData = linkTextData.trim();
						linkTextData = linkTextData.toLowerCase();
	
						var givenData =  "' . $dataval . '"; 
						givenData = givenData.trim(); 
						givenData = givenData.toLowerCase(); 
						if (linkTextData == givenData){ 
							return 1;
						} else
						{ 
							return 0;
						}
					');
					  if($result == 1){
						  $steps->executed_status = 1;
						  $steps->result_status = 1;
						  $status = 1;
					  }else{
						  $steps->executed_status = 1;
						  $steps->result_status = 0;
						  $status = 0;
					  }
			  }
			  catch(\Exception $e){
				  $error = $e->getMessage();
				  $steps->executed_status = 1;
				  $steps->result_status = 0;
				  $status = 0;
			  }
			  finally{
				  if ($status == 0) {
					  $screenshot_error = $this->readImage($var_screen_image_name);
					  $steps->screenshot_path = $screenshot_error;
					  $final_var = 1;
					  $logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					  $captureErrorLog = true;
					  //Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					  $this->webDriver->quit();
				  }
			  }
		  break;
  
		  	case 'CheckIconFilled':
				try{
				  	$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				  	$steps->executed_status = 1;
				  	if ($locatorName == "className") {
					  	$fun = "getElementsByClassName";}
					if ($locatorName == "name") {
					  	$fun = "getElementsByName";}
				 	if ($locatorName == "id") {
					  	$fun = "getElementById";}
				 	if ($locatorName == "cssSelector") {
					 	$fun = "querySelector";}
					if ($locatorName == "xpath") {
					  	//$fun = "getElementByXPath";
					  	$result=$this->webDriver->executeScript("var image=document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; var name = image.className;
							  if (name == 'fa fa-heart' ){ return 1;}
							  else { return 0; }");
					}else{
					  	$result=$this->webDriver->executeScript("var image=document.".$fun."('".$xPathGen."');var name = image.className;
							  if (name == 'fa fa-heart' ){ return 1;}
							  else { return 0; }");
				  	}
				  if($result == 1){
					  $steps->executed_status = 1;
					  $steps->result_status = 1;
					  $status = 1;
				  }else{
					  $steps->executed_status = 1;
					  $steps->result_status = 0;
					  $status = 0;
				  }
			  }
			  catch(\Exception $e){
				  $error = $e->getMessage();
				  $steps->executed_status = 1;
				  $steps->result_status = 0;
				  $status = 0;
			  }
			  finally{
				  if ($status == 0) {
					  $screenshot_error = $this->readImage($var_screen_image_name);
					  $steps->screenshot_path = $screenshot_error;
					  $final_var = 1;
					  $logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					  $captureErrorLog = true;
					  //Jira Issue Post 
						if(!empty($GLOBALS['jiraUserName'])){
							$jiraInfo['summary']    = $steps->stepDesc;
							$jiraInfo['description'] = $steps->stepDesc;
							$jiraResultJson = $this->createJiraIssue($jiraInfo);
						}
					  $this->webDriver->quit();
				  }
			  }
		  break;
  
		  //Click radio button by given value
			  case 'ClickRadioButtonByValue':
			  try{
				  sleep(3);
				  $returnData = $this->webDriver->executeScript(
				  '
				  var objectDetails = "'.$locatorName.'";
				  if(objectDetails == "cssSelector"){
					  var parentElement = document.querySelector("'.$xPathGen.'");
				  }else if(objectDetails == "xpath"){
					  var parentElement = document.evaluate("'.$xPathGen.'", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				  }else if(objectDetails == "id"){
					  var parentElement = document.getElementById("'.$xPathGen.'");
				  }
				   if(parentElement){
					  var aTags = parentElement.getElementsByTagName("label");
					  var searchText = "'.$dataval.'";
					  var found;
					  for (var i = 0; i < aTags.length; i++) {
						  if (aTags[i].innerText == searchText) {
							  found = aTags[i];
							  break;
						  }
					  }
					  if(found){
						  found.click();
						  return true;
					  }else{
						  return false;
					  }
				  }else{
					  return false;
				  }');
				  if($returnData){
					  $status = 1;
				  }else{
					  $status = 0;
				  }
				  $steps->executed_status = 1;
				  $steps->result_status = 1;
				  
			  } catch (\Exception $e) {
				  $steps->executed_status = 1;
				  $steps->result_status = 0;
				  $status = 0;
			  } finally {
				  if ($status == 0) {
					  $logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					  $captureErrorLog = true;
					  $screenshot_error = $this->readImage($var_screen_image_name);
					  $steps->screenshot_path = $screenshot_error;
					  $final_var = 1;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					  $this->webDriver->quit();
				  }
			  }
			  break;

			//CLICK BUTTON IF ITS NO CHECKED
			case 'ClickButtonIfDisable':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$checkBoxElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				if (!$checkBoxElement->isSelected()) {
					$checkBoxElement->click();
				} 
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

            //Select dropdown by value
			case 'MultiSelectDropDownbyPath':
			try{
				if ($locatorName == "className") {
					$fun = "getElementsByClassName";}
				if ($locatorName == "name") {
					$fun = "getElementsByName";}
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
				if ($locatorName == "xpath") {
					//$fun = "getElementByXPath";
					$this->webDriver->executeScript("var element = document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click(); var data = document.evaluate('".$dataval."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;var event = document.createEvent('MouseEvent');
					event.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					data.dispatchEvent(event);");
				}else{
					$this->webDriver->executeScript('var element =document.'.$fun.'("'.$xPathGen.'").click(); var data = document.'.$fun.'("'.$dataval.'"); var event = document.createEvent("MouseEvent");
						event.initMouseEvent("mouseover", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						data.dispatchEvent(event);');
				}
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::ENTER);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

				//Multi select dropdown by value
			case 'MultiSelectDropDownbyValue':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($dataval);
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::ENTER);
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;
			
			//CHECK ELEMENT BY GIVEN INDEX
			case "CheckElementPresencebyIndex":
			try{
				// if ($locatorName == "className") {
				// 	$fun = "getElementsByClassName";}
				if ($locatorName == "name") {
					$fun = "getElementsByName";}
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
				if($locatorName == "className"){
					$returnRes =$this->webDriver->executeScript('var len = "";var element =document.getElementsByClassName("'.$xPathGen.'"); len=element.length; if(len != null){ var indexData=element['.$dataval.']; if(indexData){return 1;}else{return 0;} }else{return 0;}');
				}else if ($locatorName == "xpath") {
					$returnRes =$this->webDriver->executeScript("var data =document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.getAttribute('class'); var len = ''; var element =document.getElementsByClassName(data); len=element.length; if(len != null){ var indexData=element[".$dataval."]; if(indexData){return 1;}else{return 0;} }else{return 0;}");
				}else {
					$returnRes =$this->webDriver->executeScript("var data = document.".$fun."('".$xPathGen."').getAttribute('class'); var len = ''; var element =document.getElementsByClassName(data); len=element.length; if(len != null){ var indexData=element[".$dataval."]; if(indexData){return 1;}else{return 0;} }else{return 0;} ");
				}
				if($returnRes == 1){
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				}else{
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				}
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

			// Click element by index 
			case "ClickElementbyIndex":
			try{
				if ($locatorName == "className") {
					$return = $this->webDriver->executeScript("var data =document.getElementsByClassName('".$xPathGen."')[".$dataval."];var tag = data.tagName; if(tag == 'OPTION') { data.selected=true;
					var event = document.createEvent('HTMLEvents');
					event.initEvent('change',true,false);
					data.dispatchEvent(event); return 1;} else {data.click(); return 1; } ");
				}
				if($locatorName == "cssSelector"){
					$return = $this->webDriver->executeScript("var data = document.querySelector('".$xPathGen.":nth-child(".$dataval.")');var tag = data.tagName; if(tag == 'OPTION') { data.selected=true;
					var event = document.createEvent('HTMLEvents');
					event.initEvent('change',true,false);
					data.dispatchEvent(event);return 1;} else {data.click();return 1; } ");		
				}
				if($return == 1){
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				}else{
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				}	
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

            //SET DATE
			case "SetDateOld":
			try{
				$date1 = "#owl-dt-picker-1 > div.owl-dt-container-inner > owl-date-time-calendar > div.owl-dt-calendar-main > owl-date-time-month-view > table > tbody > tr:nth-child(4) > td:nth-child(5) > span";
				$date0 = "#owl-dt-picker-0 > div.owl-dt-container-inner > owl-date-time-calendar > div.owl-dt-calendar-main > owl-date-time-month-view > table > tbody > tr:nth-child(4) > td:nth-child(5) > span";
				if ($locatorName == "className") {
					$fun = "getElementsByClassName";}
				if ($locatorName == "name") {
					$fun = "getElementsByName";}
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
				if ($locatorName == "xpath") {
					$this->webDriver->executeScript("var element =document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; var event = document.createEvent('HTMLEvents');event.initEvent('click',true,false);element.dispatchEvent(event); var eledate=element.getAttribute('aria-owns');
						if(eledate=='owl-dt-picker-1'){
							var element2=document.querySelector('".$date1."');
							element2.click();
							document.querySelector('#owl-dt-picker-1 > div.owl-dt-container-inner > div > button:nth-child(2) > span').click(); 
							element.value='".$dataval."';
						}else{
					 		var element2=document.querySelector('".$date0."');
					 		element2.click(); 
					 		element.value='".$dataval."';}  ");
				}
				else{
					$this->webDriver->executeScript("var element =document.".$fun."('".$xPathGen."'); var event = document.createEvent('HTMLEvents');event.initEvent('click',true,false);element.dispatchEvent(event); var eledate=element.getAttribute('aria-owns');
						if(eledate=='owl-dt-picker-1'){
							var element2=document.querySelector('".$date1."');
							element2.click();
							document.querySelector('#owl-dt-picker-1 > div.owl-dt-container-inner > div > button:nth-child(2) > span').click();
					 		element.value='".$dataval."';
					 	}else{
					 		var element2=document.querySelector('".$date0."');
					 		element2.click(); 
					 		element.value='".$dataval."';}  ");	
				}
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

			//SET DATE
			case 'SetDate':
			try{
				$steps->executed_status = 1;
				$datesplit = explode("-",$dataval);
				if(!empty($dataval)&&count($datesplit)==3){
					$year    = intval($datesplit[2]);
					$month   = intval($datesplit[1]);
					$date    = intval($datesplit[0]);
	
					if ($locatorName == "name") {
						$fun = "getElementsByName";
					}
					if ($locatorName == "id") {
						$fun = "getElementById";
					}
					if ($locatorName == "cssSelector") {
						$fun = "querySelector";
					}
					if ($locatorName == "xpath") {
						$this->webDriver->executeScript("var element =document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; 
														element.click();");
					}else{
						$this->webDriver->executeScript("var element =document.".$fun."('".$xPathGen."');element.click();");
					}
                
				$this->webDriver->executeScript(
					"yearElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container > div.owl-dt-container-inner > owl-date-time-calendar > div.owl-dt-calendar-control > div > button');
					dateElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container');
					arrayElement = dateElement.getElementsByTagName('td');
					yeartextElement= yearElement.getElementsByTagName('span')[0].innerText;
					yearText = yeartextElement; 
					var strArray = yearText.split(' ');
					// Display array values on page
					var yearstring = strArray[1].trim();
					yearElement.click();
					if('".$year."' == yearstring){
						changeClickElement = '';
					}
					else if('".$year."'<yearstring){
						changeClickElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container > div.owl-dt-container-inner > owl-date-time-calendar > div.owl-dt-calendar-control > button:nth-child(1)');
					}
					else if('".$year."'>yearstring){
						changeClickElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container > div.owl-dt-container-inner > owl-date-time-calendar > div.owl-dt-calendar-main > owl-date-time-multi-year-view > button:nth-child(3)');
					}	
					var clickelement =false;
					while(clickelement==false){
						if(changeClickElement){
						changeClickElement.click();
						}
						var i;
						dateElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container');
						arrayElement = dateElement.getElementsByTagName('td');
						for(i=0;i<= arrayElement.length;i++)
							{
								spanElement = arrayElement[i];
								if(spanElement){
									textElement = spanElement.getElementsByTagName('span')[0].innerText;
									if(textElement=='".$year."'){
										clickelement = spanElement.getElementsByTagName('span')[0].click();
										break;
									}else{
										clickelement=false;
									}
								}
							}
						}
					
					//set month
					var month_name = function(dt){
					mlist = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
							return mlist[dt.getMonth()];
					};
					month = month_name(new Date('".$month."'));
					monthElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container');
					arrayElement = monthElement.getElementsByTagName('td');
					var i;
					for(i=0;i<= arrayElement.length;i++)
						{
							spanElement = arrayElement[i];
							if(spanElement){
								textElement = spanElement.getElementsByTagName('span')[0].innerText;
								if(month==textElement) {
									spanElement.getElementsByTagName('span')[0].click();
									break;
								}  
							}
						}
							
					//set date
					dateElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container');
					arrayElement = dateElement.getElementsByTagName('td');
					date = '".$date."';
					var i;
					for(i=0;i<= arrayElement.length;i++)
						{
							spanElement = arrayElement[i];
							if(spanElement){
								textElement = spanElement.getElementsByTagName('span')[0].innerText;
								if(date==textElement) {
									spanElement.getElementsByTagName('span')[0].click();
									setElement = document.querySelector('body > div.cdk-overlay-container > div.cdk-overlay-pane.owl-dt-popup > owl-date-time-container > div.owl-dt-container-inner > div > button:nth-child(2)');
									if(setElement){
									setElement.click();
									}
									break;
								}  
							}
					}");
					$steps->result_status = 1;
					$status = 1;
			 }else{
					$steps->result_status = 0;
					$status = 0;
			 }
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}

			break;

			//WAIT UNTILL ELEMENT IS CLICKABLE
				case 'WaitUntilElementIsClickable':
				try {
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$this->webDriver->wait()->until(
						WebDriverExpectedCondition::elementToBeClickable(WebDriverBy::{$locatorName}($xPathGen))
					);
					$clickElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
					$clickElement->click();
					$steps->executed_status = 1;
					$steps->result_status = 1;
					$status = 1;
				} catch (\Exception $e) {
					$error = $e->getMessage();
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				} finally {
					if ($status == 0) {
						$screenshot_error = $this->readImage($var_screen_image_name);
						$steps->screenshot_path = $screenshot_error;
						$final_var = 1;
						$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
						$captureErrorLog = true;
						//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
						$this->webDriver->quit();
					}
				}
			break;


			//CHECK PARTIAL STING SHOULD NOT CONTAIN IN ELEMENT
			case 'AssertNotContains':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$element       =  $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$givenDataVal  =  strtolower(trim(utf8_encode($dataval)));
				$getText       =  strtolower(trim($element->getText()));
				// $pos           =  strpos($getText, $givenDataVal);
				// $steps->executed_status = 1;
				// if ($pos !== false) {
				// 	$steps->result_status = 0;
				// 	$status = 0;
				// }else{
				// 	$steps->result_status = 1;
				// 	$status = 1;
				// }
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
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

			//TRIM STRING BASED ON GIVEN DATA
			case 'GetPartialText':
			try {
				$steps->executed_status = 1;
				$GLOBALS['trimText'] = "";
				if($dataval){
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$searchElement 	= $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
					$searchText    	= $searchElement->getText();
					$splitVariable  = $dataval;
					$explodeData   	= explode(",",$splitVariable);
					$startData  	= $explodeData[0];
					$endData   	 	= $explodeData[1];
					$trimedVar 		= substr($searchText,$startData);
					$finalTrimText  = substr($trimedVar,0,$endData);
					//Set in global text
					$GLOBALS['trimText'] = $finalTrimText;
					$steps->result_status   = 1;
					$status = 1;
				}else{
					$steps->result_status   = 0;
					$status = 0;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;
			
			
			//SEARCH TRIM TEXT
			case 'SetPartialText':
				try {
					$steps->executed_status = 1;
					$searchOrder = $GLOBALS['trimText'];
					if($searchOrder){
						$this->webDriver->manage()->timeouts()->implicitlyWait(30);
						$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($searchOrder);
						$steps->result_status = 1;
						$status = 1;
					}else{
						$steps->result_status   = 0;
						$status = 0;
					}
				} catch (\Exception $e) {
					$error = $e->getMessage();
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				} finally {
					if ($status == 0) {
						$screenshot_error = $this->readImage($var_screen_image_name);
						$steps->screenshot_path = $screenshot_error;
						$final_var = 1;
						$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
						$captureErrorLog = true;
						//Jira Issue Post 
						if(!empty($GLOBALS['jiraUserName'])){
							$jiraInfo['summary']    = $steps->stepDesc;
							$jiraInfo['description'] = $steps->stepDesc;
							$jiraResultJson = $this->createJiraIssue($jiraInfo);
						}
						$this->webDriver->quit();
					}
				}
				break;

			case 'SelectLinkbyValue':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				$steps->executed_status = 1;
				$locationArray = explode(",", $xPathGen);
				$first = $locationArray[0];
				$second = $locationArray[1];
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($first))->click();
				$parent = $this->webDriver->findElement(WebDriverBy::{$locatorName}($second));
				$child = $parent->findElements(WebDriverBy::tagName('a'));
				for($i=0; $i<sizeof($child); $i++){
					$childText = $child[$i]->getText();
					if ($childText == $dataval) {
						$child[$i]->click();
						sleep(2);
						$steps->result_status = 1;
						$status = 1;
						break;
					}else{
						$steps->result_status = 0;
						$status = 0;
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//Checks dropdown value, if already selected it will leave,else it will select the value
		case 'CheckandSelectDropDownValue':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				$steps->executed_status = 1;
				$locationArray = explode(",", $xPathGen);
				$first = $locationArray[0];
				$second = $locationArray[1];
				$text = $this->webDriver->findElement(WebDriverBy::{$locatorName}($first))->getText();
				if($text != $dataval){
					$this->webDriver->findElement(WebDriverBy::{$locatorName}($first))->click();
					$parent = $this->webDriver->findElement(WebDriverBy::{$locatorName}($second));
					$child = $parent->findElements(WebDriverBy::tagName('a'));
					for($i=0; $i<sizeof($child); $i++){
						$childText = $child[$i]->getText();
						if ($childText == $dataval) {
							$child[$i]->click();
							sleep(2);
							$steps->result_status = 1;
							$status = 1;
							break;
						}else{
							$steps->result_status = 0;
							$status = 0;
						}
					}	
				}
				else {
					$steps->result_status = 1;
					$status = 1;	
				}		
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//For Scroll the Page to Left
		case 'ScrollLeft':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(20);
				if (!empty($dataval)) {
					$dataval= '-'. $dataval;
					$this->webDriver->executeScript('window.scrollBy("'.$dataval.'",0);');
				} else {
					$this->webDriver->executeScript('window.scrollTo(0,0);');
				}
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;

		//DOUBLE CLICK
				case 'DoubleClick':
				try {
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$steps->executed_status = 1;
					//Get Element To Click
					$element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
					$action = new WebDriverActions($this->webDriver);
					//Perform Double Click Action
					$action->doubleClick($element)->perform();
					$steps->result_status = 1;
					$status = 1;
				} catch (\Exception $e) {
					$error = $e->getMessage();
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				} finally {
					if ($status == 0) {
						$screenshot_error = $this->readImage($var_screen_image_name);
						$steps->screenshot_path = $screenshot_error;
						$final_var = 1;
						$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
						$captureErrorLog = true;
						//Jira Issue Post 
						if(!empty($GLOBALS['jiraUserName'])){
							$jiraInfo['summary']    = $steps->stepDesc;
							$jiraInfo['description'] = $steps->stepDesc;
							$jiraResultJson = $this->createJiraIssue($jiraInfo);
						}
						$this->webDriver->quit();
					}
				}	
				break;

                //scroll to right 
				case 'ScrollRight':
					try {
						
						if (!empty($dataval)) {
							$this->webDriver->executeScript('window.scrollBy("'.$dataval.'",0);');
						}else{
							$this->webDriver->executeScript('calculatedwidth = 0;
							scrollwidth=1;
							for(i=0;scrollwidth!=calculatedwidth;i++){
							scrollwidth = document.body.scrollWidth;  
							window.scrollBy(scrollwidth,0);  
							await new Promise(resolve => setTimeout(resolve, 3000));;
							calculatedwidth = document.body.scrollWidth;
							}');
						}
						$steps->executed_status = 1;
						$steps->result_status = 1;
						$status = 1;
					} catch (\Exception $e) {
						$error = $e->getMessage();
						$steps->executed_status = 1;
						$steps->result_status = 0;
						$status = 0;
					} finally {
						if ($status == 0) {
							$screenshot_error = $this->readImage($var_screen_image_name);
							$steps->screenshot_path = $screenshot_error;
							$final_var = 1;
							$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
							$captureErrorLog = true;
							//Jira Issue Post 
							if(!empty($GLOBALS['jiraUserName'])){
								$jiraInfo['summary']    = $steps->stepDesc;
								$jiraInfo['description'] = $steps->stepDesc;
								$jiraResultJson = $this->createJiraIssue($jiraInfo);
							}
							$this->webDriver->quit();
						}
					}
				break;

				//select multi select by given value
				case 'MultiSelectByValue':
				try {
					sleep(4);
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$steps->executed_status = 1;
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));		
					$childElements = $parentElement->findElements(WebDriverBy::tagName("option"));
					$dataArray = explode(",",$dataval);
					$action2 = new WebDriverActions($this->webDriver);
					$action2->keyDown(NULL,WebDriverKeys::CONTROL);
					foreach($childElements as $childElement){
						foreach($dataArray as $data){
							$text = $childElement->getText();
							if($data==$text){
								//To perform  click
								$action2->click($childElement);
								sleep(3);
							}

						}

					}
					$action2->keyUp(NULL,WebDriverKeys::CONTROL);
					$action2->perform();
					$steps->result_status = 1;
					$status = 1;
				} catch (\Exception $e) {
					$error = $e->getMessage();
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				} finally {
					if ($status == 0) {
						$screenshot_error = $this->readImage($var_screen_image_name);
						$steps->screenshot_path = $screenshot_error;
						$final_var = 1;
						$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
						$captureErrorLog = true;
						//Jira Issue Post 
						if(!empty($GLOBALS['jiraUserName'])){
							$jiraInfo['summary']    = $steps->stepDesc;
							$jiraInfo['description'] = $steps->stepDesc;
							$jiraResultJson = $this->createJiraIssue($jiraInfo);
						}
						$this->webDriver->quit();
					}
				}
				break;


				//check given options are available in element
				case 'CheckOptions':
				try {
					sleep(4);
					$this->webDriver->manage()->timeouts()->implicitlyWait(30);
					$steps->executed_status = 1;
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));		
					$childElements = $parentElement->findElements(WebDriverBy::tagName("option"));
					$dataArray = explode(",",$dataval);
					$count = "";
					foreach($childElements as $childElement){
						$elementArray[] = strtolower(trim($childElement->getText()));
					}
						foreach($dataArray as $data){
							$giventtext = strtolower(trim($data));
							if(in_array($giventtext,$elementArray)){
								
							}else{
								$count++;
							}

						}
					if($count==0){
						$steps->result_status = 1;
						$status = 1;
					}else{
						$steps->result_status = 0;
						$status = 0;
					}
				} catch (\Exception $e) {
					$error = $e->getMessage();
					$steps->executed_status = 1;
					$steps->result_status = 0;
					$status = 0;
				} finally {
					if ($status == 0) {
						$screenshot_error = $this->readImage($var_screen_image_name);
						$steps->screenshot_path = $screenshot_error;
						$final_var = 1;
						$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
						$captureErrorLog = true;
						//Jira Issue Post 
						if(!empty($GLOBALS['jiraUserName'])){
							$jiraInfo['summary']    = $steps->stepDesc;
							$jiraInfo['description'] = $steps->stepDesc;
							$jiraResultJson = $this->createJiraIssue($jiraInfo);
						}
						$this->webDriver->quit();
					}
				}
				break;

			//Check the selected value in dropdown
		case 'CheckSelectedValue':
			try {
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$Element = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$givenDataVal      = strtolower(trim(utf8_encode($dataval)));
				$getText           = strtolower(trim($Element->getAttribute('value')));
				$steps->executed_status = 1;
				if ((strcmp($givenDataVal, $getText))) {
					$steps->result_status = 0;
					$status = 0;
				} else {
					$steps->result_status = 1;
					$status = 1;
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;

			//CHECK ELEMENT IS DISABLE
			case 'CheckSelectElementDisable':
			try {
				sleep(3);
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				
				if ($locatorName == "id") {
					$fun = "getElementById";}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";}
					
				if ($locatorName == "xpath") {
					$isMulitple =$this->webDriver->executeScript("var element =document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.multiple;return element;");
				}else {
					$isMulitple =$this->webDriver->executeScript("var element = document.".$fun."('".$xPathGen."').multiple;return element;");
				}
				//$isMulitple = $this->webDriver->executeScript("element = document.querySelector('".$xPathGen."').multiple;return element;");
				if($isMulitple){
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));	
					$childElements = $parentElement->findElements(WebDriverBy::tagName("optgroup"));
					foreach($childElements as $childElement){
						$label = $childElement->getAttribute('label');
						if(trim($label)!="Available"){
							///echo "yes";exit;
							$steps->result_status = 1;
							$status = 1;
						}else{
							//echo "no";exit;
							$steps->result_status = 0;
							$status = 0;
						}
					}
				}else{
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));		
					if($parentElement->isEnabled()){
						$steps->result_status = 0;
						$status = 0;						
					}else{
						$steps->result_status = 1;
						$status = 1;						
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;


			//CHECK ELEMENT IS DISABLE
			case 'CheckSelectElementEnable':
			try {
				sleep(3);
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$steps->executed_status = 1;
				
				if ($locatorName == "id") {
					$fun = "getElementById";
				}
				if ($locatorName == "cssSelector") {
					$fun = "querySelector";
				}
					
				if ($locatorName == "xpath") {
					$isMulitple =$this->webDriver->executeScript("var element =document.evaluate('".$xPathGen."',document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.multiple;return element;");
				}else {
					$isMulitple =$this->webDriver->executeScript("var element = document.".$fun."('".$xPathGen."').multiple;return element;");
				}
				//$isMulitple = $this->webDriver->executeScript("element = document.querySelector('".$xPathGen."').multiple;return element;");
				if($isMulitple){
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));	
					$childElements = $parentElement->findElements(WebDriverBy::tagName("optgroup"));
					foreach($childElements as $childElement){
						$label = $childElement->getAttribute('label');
						if(trim($label)!="Available"){
							///echo "yes";exit;
							$steps->result_status = 0;
							$status = 0;
						}else{
							//echo "no";exit;
							$steps->result_status = 1;
							$status = 1;
						}
					}
				}else{
					$parentElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));		
					if($parentElement->isEnabled()){
						$steps->result_status = 1;
						$status = 1;						
					}else{
						$steps->result_status = 0;
						$status = 0;						
					}
				}
			} catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
			break;

		//Selects the option from the dropdown in which hmtl is binded in the object tag
		case 'DropDownSelect':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$locationArray = explode(",", $xPathGen);
				$first = $locationArray[0];
				$second = $locationArray[1];
				$this->webDriver->executeScript("var selectedValue='".$dataval."';  
					parent = document.getElementById('".$first."');
					var element = parent.contentDocument.body; 
					var ele=element.getElementsByTagName('form'); 
					var dropdown = ele[0].elements.".$second.";
					for(var count in dropdown.options){
						if(dropdown.options[count].text==selectedValue){
							dropdown.options[count].selected=true;
							var event = document.createEvent('HTMLEvents');
							event.initEvent('change',true,false);
							dropdown.dispatchEvent(event);
						}
					}" );
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
		}
		break;

		//If the session is existing, it login will again else continue further
		case 'CheckSession':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$url = $this->webDriver->executeScript("var url = document.documentURI; return url;");
				$urlElements = explode("/", $url);
				$SessionName = $urlElements[3];
				if($SessionName == "SessionEnd.aspx?ps=1"){
					
					$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->click();
					sleep(3);	
					$this->webDriver->findElement(WebDriverBy::{$locatorName}($dataval))->click();
				} 
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$this->webDriver->quit();
				}
			}
		break;


		/*Client (Syam software)specfic action to click classification actions*/
			case 'ClassificationClick':
			try
			{
				
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);				
				$this->webDriver->executeScript('var obj= document.getElementById("panelcontentobject");
					obj.contentWindow.document.querySelector("'.$xPathGen.'").click();
						');
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;

			}catch(\Exception $e)
			{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;

			} finally{
				if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;

					$this->webDriver->quit();
				}

			}
			break;

			
		/*Client (Syam software)specfic action to click classification actions*/
			case 'ClickHtmlObject':
			try
			{	$xPathGen = $steps->objectDetail;
					$locatorName = $steps->locatorName;
					sleep(3);
					if ($locatorName == "id") {
					$fun = "getElementById";}

					if ($locatorName == "cssSelector") {
					$fun = "querySelector";}

				$this->webDriver->manage()->timeouts()->implicitlyWait(30);				
				$this->webDriver->executeScript('var obj= document.getElementById("panelcontentobject").contentWindow;
					obj.document.'.$fun.'("'.$xPathGen.'").click();
						');
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;

				

			}catch(\Exception $e)
			{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally{
					if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;

					$this->webDriver->quit();
				
				
			}

			}
			break;

		//Selects the option from the left filter tree by the given value
		case 'FilterTreeSelectByValue':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$res=0;
				$st=0;
				$steps->executed_status = 1;
				$mainElement = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$table=$mainElement->findElements(WebDriverBy::tagName('table'));
				for($i=0;$i<sizeof($table); $i++){
					$tbody = $table[$i]->findElements(WebDriverBy::tagName('tbody'));
					for($j=0;$j<sizeof($tbody); $j++){
						$row = $tbody[$j]->findElements(WebDriverBy::tagName('tr'));
					 	for($k=0;$k<sizeof($row); $k++){
					 		$td = $row[$k]->findElements(WebDriverBy::tagName('td'));
					 		$size = sizeof($td);
					 		$getText          = strtolower(trim($td[$size-1]->getText()));
					 		$givenDataVal     = strtolower(trim(utf8_encode($dataval)));
					 		if($getText==$givenDataVal){
					 			if($size == 2){
					 				$td[$size-2]->click(); 
									$res=1;
					 				$st=1;
					 			}
					 			else if($size == 3){
					 				$parent = $td[$size-1];
						 			$checkbox = $parent->findElements(WebDriverBy::tagName('input'));
						 			$checkbox[0]->click();
									$res=1;
						 			$st=1;	
					 			}			
					 		}
					 	}
					}
				}
				$steps->result_status = $res;
				$status = $st;
				sleep(5);
			}catch (\Exception $e) {
				//print_r($e->getMessage()); exit();
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;

		// Select classification options from object tag

			case 'SetHtmlObject':

			try
			{
				
					$xPathGen = $steps->objectDetail;
					$locatorName = $steps->locatorName;
					if ($locatorName == "id") {
					$fun = "getElementById";}

					if ($locatorName == "cssSelector") {
					$fun = "querySelector";}

				$this->webDriver->manage()->timeouts()->implicitlyWait(30);				
				$this->webDriver->executeScript('
					var selectedValue="'.$dataval.'"
					var obj= document.getElementById("panelcontentobject").contentWindow;
					var values_check=obj.document.'.$fun.'("'.$xPathGen.'");
					for(i=0;i<values_check.options.length;i++)
						{
				if(values_check.options[i].text==selectedValue)
					{
				values_check.options[i].selected=true;

				var event = document.createEvent("HTMLEvents");
				event.initEvent("change",true,false);
				values_check.dispatchEvent(event);return true;}}
						');
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
				
			}catch(\Exception $e)
			{
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			}finally
			{
					if ($status == 0) {
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;

					$this->webDriver->quit();
				
				
					}
			}
			break;

		// Enter the value inside the object tag
		case 'ObjTagEnter':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$locationArray = explode(",", $xPathGen);
				$first = $locationArray[0];
				$second = $locationArray[1];
				$this->webDriver->executeScript(" 
					parent = document.getElementById('".$first."');
					var element = parent.contentDocument.body; 
					var ele=element.getElementsByTagName('form'); 
					var textelement = ele[0].elements.".$second.";
					textelement.value='".$dataval."';
					" );
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
		}
		break;

		// Click the button inside the object tag
		case 'ObjTagClick':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$locationArray = explode(",", $xPathGen);
				$first = $locationArray[0];
				$second = $locationArray[1];
				$this->webDriver->executeScript(" 
					parent = document.getElementById('".$first."');
					var element = parent.contentDocument.body; 
					var ele=element.getElementsByTagName('form'); 
					var clickelement = ele[0].elements.".$second.";
					clickelement.click();
					" );
				$steps->executed_status = 1;
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
		}
		break;	

		// Compares the given text with text in the application inside the object tag
		case 'ObjTagEquals':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$result = 0 ;
				$steps->executed_status = 1;
				$locationArray = explode(",", $xPathGen);
				$firstId = $locationArray[0];
				$secondId = $locationArray[1];

				$dataArray = explode(",", $dataval);
				$columnNo = $dataArray[0]-1;
				$checkvalue = $dataArray[1];
				$result = $this->webDriver->executeScript(" 
					parent = document.getElementById('".$firstId."');
					var element = parent.contentDocument.body; 
					var ele=element.getElementsByTagName('form'); 
					var table = ele[0].getElementsByTagName('table')[1]; 
					var val = table.getAttribute('id'); 
					if(val == '".$secondId."') { 
						var body = table.getElementsByTagName('tbody')[0]; 
						var tr = body.getElementsByTagName('tr'); 
						for(var i=0; i<tr.length;i++ ){
							var td = tr[i].getElementsByTagName('td')[".$columnNo."].textContent;
							if(td == '".$checkvalue."') { return 1; }}}
					" );
				if($result == 1) {
					$steps->result_status = 1;
					$status = 1;
				}
				else{
					$steps->result_status = 0;
					$status = 0;
				}
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;

		//Click the span element based on given data
		case 'ClickByValue':
			try{
				$this->webDriver->manage()->timeouts()->implicitlyWait(30);
				$res=0;
				$st=0;
				$steps->executed_status = 1;
				$parent = $this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen));
				$listElement = $parent->findElements(WebDriverBy::tagName('li'));
				for($i=0;$i<sizeof($listElement); $i++){
					$getText = $listElement[$i]->getText();
					if($getText == $dataval){
						$clickElement = $listElement[$i]->findElements(WebDriverBy::tagName('span'));
						$clickElement[0]->click();
						$res=1;
						$st=1;	
					}
				} 
				$steps->result_status = $res;
				$status = $st;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;

		//Click the span element based on given data
		case 'FileUpload':
			try{
				$steps->executed_status = 1;
				$imagePath = $dataval;
				$this->webDriver->findElement(WebDriverBy::{$locatorName}($xPathGen))->sendKeys($imagePath);
				$buttonElement = "body > div.modal.fade.ng-isolate-scope.in > div > div > section > div.panel-body > form > div:nth-child(2) > button";
				$uploadId = "upload_file";
				$this->webDriver->executeScript("
				var element =document.querySelector('".$buttonElement."');
				var event = document.createEvent('HTMLEvents');
				event.initEvent('click',true,false);element.dispatchEvent(event); 
				var element1 =document.getElementById('".$xPathGen."');
				var event1 = document.createEvent('HTMLEvents');
				event1.initEvent('change',true,false);
				element1.dispatchEvent(event1);");
				$this->webDriver->getKeyboard()->pressKey(WebDriverKeys::TAB);
				sleep(4);
				$steps->result_status = 1;
				$status = 1;
			}catch (\Exception $e) {
				$error = $e->getMessage();
				$steps->executed_status = 1;
				$steps->result_status = 0;
				$status = 0;
			} finally {
				if ($status == 0) {
					$screenshot_error = $this->readImage($var_screen_image_name);
					$steps->screenshot_path = $screenshot_error;
					$final_var = 1;
					$logs = $this->recordErrorLog($steps, $captureErrorLog, $error);
					$captureErrorLog = true;
					//Jira Issue Post 
					if(!empty($GLOBALS['jiraUserName'])){
						$jiraInfo['summary']    = $steps->stepDesc;
						$jiraInfo['description'] = $steps->stepDesc;
						$jiraResultJson = $this->createJiraIssue($jiraInfo);
					}
					$this->webDriver->quit();
				}
			}
		break;
		
		}


		if ($steps->screenShot == 'After') {
			if ($final_var != 1) {

				$screenshot = $this->takeScreenshot($steps->screenShot, $locatorName);

				$steps->screenshot_path = $screenshot;
			}

			$this->unlinkTemp();

		}

		return $steps;
	}

	public function executeGroup($data) {

		$browserTypeId = $data->result->browserTypeId;
		$testcase_interation = $data->result->testCase;
		$groupName = $data->result->groupName;
		$groupId = $data->result->groupId;
		$environmentId = $data->result->environmentId;
		$applicationId = $data->result->applicationId;
		$platformId = $data->result->platformId;
		$iterationval = $data->result->iterationval;

		//Jira configuration details
		$GLOBALS['jiraUserName']    = $data->result->jiraUserName;
 		$GLOBALS['jiraPassword']    = $data->result->jirapassword;
		$GLOBALS['jiraSiteName']    = $data->result->jiraUserSiteName;
		$GLOBALS['projectJiraKey']  = $data->result->projectJiraKey;


		$i = 0;
		$this->initiate_browser($browserTypeId);
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
		$this->webDriver->quit();
		return $data;
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

			$this->webDriver->quit();

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

//To check screenshot folder is exists
	public function checkDir() {

		try {
			if (!file_exists($this->screenshotfolder_path) && !is_dir($this->screenshotfolder_path)) {

				$screenshot_path = realpath(dirname(__FILE__) . '/..');
				$this->mkDir($screenshot_path, "screenshot");

			}
			if (!file_exists($this->screenshotfolder_temp) && !is_dir($this->screenshotfolder_temp)) {

				$this->mkDir($this->screenshotfolder_path, "temp");

			}
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);

		}
	}

	public function mkDir($path, $folder_name) {
		try {
			mkdir("$path" . "/" . "$folder_name", 0777);
			chmod("$path" . "/" . "$folder_name", 0777);
			return true;
		} catch (\Exception $e) {
			throw new Exception($e);

		}

	}

	//To take screen shot

	public function takeScreenshot($event, $stepId, $folder_name = '') {

		if (!isset($this->webDriver) || $this->webDriver === null) {
			return '';
		}

		if ($folder_name == '') {
			$folder_name = "$this->screenshotfolder_path";
		} else {
			$folder_name = "$this->screenshotfolder_temp";

		}

		//	$file_name ="$folder_name" . '/' . date('Y-m-d_H-i-s') . "_" . $event . "_" . "" . $stepId . '.png';
		$file_name = "$folder_name" . '/' . "$this->result_ref_id" . "_" . date('Y-m-d_H-i-s') . "_" . $event . '.png';

		$this->webDriver->takeScreenshot($file_name);

		$exp_name = explode('/', $file_name);
		$exp_num = (count($exp_name) - 1);
		$scren_shot_name = $exp_name[$exp_num];
		return $scren_shot_name;

	}

	public function readImage($image_name = '') {

		if (file_exists($this->screenshotfolder_temp . "/" . $image_name)) {

			try
			{
				copy($this->screenshotfolder_temp . "/" . $image_name, $this->screenshotfolder_path . "/" . $image_name);

				foreach (glob($this->screenshotfolder_temp . "/*", GLOB_NOSORT) as $value) {
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

	public function unlinkTemp() {
		if (file_exists($this->screenshotfolder_temp)) {

			try
			{

				foreach (glob($this->screenshotfolder_temp . "/*", GLOB_NOSORT) as $value) {
					if ($value != '') {
						unlink($value);
					}
				}

				return true;
			} catch (\Exception $e) {
				throw new Exception($e);

			} finally {return true;}

		}
	}

	public function recordErrorLog($steps, $errorStatus, $exception) {
		if (!$errorStatus) {
			$logs = $this->getJsLog($exception);
			$steps->errorLog = $logs;
		}
		return $steps;
	}

	public function getJsLog($exception) {
		// $logs['browserLogs'] = $this->webDriver->manage()->getLog("browser");
		// $logs['driverLogs'] = $this->webDriver->manage()->getLog("driver");
		// $logs['exception'] = $exception;
		// return $logs;
		if ($this->browser_type == 1) {
			$logs['browserLogs'] = $this->webDriver->manage()->getLog("browser");
			$logs['driverLogs'] = $this->webDriver->manage()->getLog("driver");
		} else {
			$logs['browserLogs'] = null;
			$logs['driverLogs'] = null;
		}

		$logs['exception'] = $exception;
		return $logs;
	}



	//Create issue in JIRA
	public function createJiraIssue($data) {
		try{
		
		//Get user name and password of jira
	    	$userName       = $GLOBALS['jiraUserName'];
	    	$password       = $GLOBALS['jiraPassword'];
            $jiraSiteName   = $GLOBALS['jiraSiteName'];
			$projectJiraKey = trim($GLOBALS['projectJiraKey']);
            $jiraPostUrl    = 'https://'.$jiraSiteName.'.atlassian.net/rest/api/2/issue/';

		
		//Encode user name and password for jira authorization
		$base64_usrpwd = base64_encode($userName.':'.$password);
	
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $jiraPostUrl);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json','Authorization: Basic '.$base64_usrpwd)); 
	
		$arr['project']     = array( 'key' => $projectJiraKey);
		$arr['summary']     = $data['summary'];
		$arr['description'] = $data['description'];
		$arr['issuetype']   = array( 'name' =>"Bug");
	     // $arr['assignee']    = array('name'=>"me");
		$arr['priority']    = array( 'name' =>"Highest");
	     // $arr['labels']      = ;
	
		$json_arr['fields'] = $arr;
	
		$json_string = json_encode ($json_arr);
		curl_setopt($ch, CURLOPT_POSTFIELDS,$json_string);
		$result = curl_exec($ch);
		curl_close($ch);
		return $result;
		}catch (Exception $e) {
		$steps->executed_status = 1;
		$steps->result_status = 0;
		// status hard coded need to check
		$status = 0;
	        } 
	}

}

?>