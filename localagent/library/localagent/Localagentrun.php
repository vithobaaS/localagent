<?php
defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));
require_once BASE_PATH . '/MobileWebsiteTest.php';
require_once BASE_PATH . '/Autopropeltest.php';
require_once BASE_PATH . '/MobileAppTest.php';

class Localagentrun {
	public function __construct() {
		$this->config = new Configs();
	}
	public function run_local($data_para,$result_ref_id) {
		$data = $data_para;
		//$data = json_decode($data_para);
		//print_r($data);exit;
		if ($data->result->environmentId == $this->config->getData('environmentType.desktop')) {
			$Selenium = new Autopropeltest($result_ref_id);
			$curl_update = $Selenium->executeGroup($data);
			return $curl_update;
		} else if ($data->result->environmentId == $this->config->getData('environmentType.mobile')) {
			if ($data->result->platformId == $this->config->getData('platformType.Android') && $data->result->applicationId == $this->config->getData('applicationType.MobileWebsite')) {
				$appium = new MobileWebsiteTest();
			} else if ($data->result->platformId == $this->config->getData('platformType.Android') && $data->result->applicationId == $this->config->getData('applicationType.Native')) {
				$appium = new MobileAppTest();
			}
			$curl_update = $this->processInit($data, $appium);
			return $curl_update;

		} else {
			return array("msg" => "Invalid input");
		}

	}

	public function get_cases($data_para) {

		$data = json_decode($data_para);
		$method = $this->config->getData('service_method.post_method');
		$val = '';
		//$data->result->request_handler = $data->result->token;

		$headers = [
			'Content-Type' => 'application/json',
			'Authorization' => $data->result->request_handler,
		];
		$url = $data->result->serviceUrl;

		$data = $data->result;
		$group_ids = $data->executionData;
			$parameterization_status=0;
		if(isset($data->source_status))
		{
			$parameterization_status=1;
		}
		$ary_value = array("environmentId" => $data->environmentId, "projectId" => $data->projectId, "environmentName" => $data->environmentName, "applicationId" => $data->applicationId, "applicationName" => $data->applicationName, "platformId" => $data->platformId, "platformName" => $data->platformName, "request_handler" => $data->request_handler, "browserTypeId" => $data->browserTypeId, "browserTypeName" => $data->browserTypeName, "type" => $data->type, "id" => "", "referenceId" => "", "executionId" => "", "executionName" => $data->executionName, "iteration" => "");

			$result_ref_id=$data->referenceId;

		$result_ary = array();
		$parameterization_ary=array();
		$grop_count = 0;

		foreach ($group_ids as $value) {
			$ary_value['executionId'] = $value->groupId;
			$ary_value['id'] = $value->id;
			$ary_value['referenceId'] = $value->referenceId;
			$ary_value['iteration'] = "iteration" . $value->iteration;
			$endpoint = $this->config->getData('service_endpoints.get_case_url');
			//	$groupCase = $this->serviceRequest($method, $url, $headers, $endpoint, $ary_value);
			//$this->getGroupcase($method,$headers,$ary_value);
			$groupCase = $this->serviceRequest($method, $url, $headers, $endpoint, $ary_value); 
			$selenium_test = $this->run_local($groupCase->result,$result_ref_id);

			$group_count = $grop_count++;
			$selenium_test->result->group_count = $grop_count;
			array_push($result_ary, $selenium_test->result->result_status);
			$parameterization_ary[$value->referenceId]=$selenium_test->result->result_status;
			$endpoint = $this->config->getData('service_endpoints.group_case_up');
		$updateresult = $this->serviceRequest($method, $url, $headers, $endpoint, $selenium_test); //$this->updateGroupcase($method,$headers,$selenium_test);

		
			$response_data=$updateresult->result->result;

			$error_ary[]=$this->generateErrorlogs($response_data);
		}

		if (in_array(0, $result_ary)) {
			$result_status = 0;
		} else {
			$result_status = 1;
		}

		$test_result_id = $ary_value['referenceId'];

		$result_status_ary = array("result_status" => $result_status, "test_result_id" => $test_result_id,"error_log"=>$error_ary,"parameterization_status"=>$parameterization_status,"test_results"=>$parameterization_ary);
		$endpoint = $this->config->getData('service_endpoints.update_result');
		$updateTest_result = $this->serviceRequest($method, $url, $headers, $endpoint, $result_status_ary);
		//echo json_encode($updateTest_result); exit();
		return $updateTest_result->result;

	}

	public function processInit($data, $process) {
		$val = $process->executeGroup($data);
		if ($val) {
			return $val;
		} else {
			return array("msg" => "Invalid Package");
		}

		// $exe_type = $data->result->executionType;
		// $url = $data->result->serviceUrl;
		// $method = $this->config->getData('service_method.post_method');
		// $val = '';
		// $headers = [
		// 	'Content-Type' => 'application/json',
		// 	'Authorization' => $data->result->request_handler,
		// ];
		// if (isset($data->result->request_handler)) {

		// 	$client = new \Requesthandler();
		// 	$url = $url . $this->config->getData('service_endpoints.suite_execute');
		// 	if ($exe_type == 'suite') {
		// 		$suiteReference = $this->initiateTestResult($method, $headers, $data);

		// 		if ($suiteReference) {
		// 			foreach ($data->result->testGroup as $key => $value) {
		// 				$val = (object) $process->Groupexecutions($value, $data->result->browserTypeId);
		// 				$val->reference_id = $suiteReference;
		// 				$res = $client->serviceRequest($method, $url, $headers, $val);
		// 			}
		// 			return $res;
		// 		}
		// 	}

		// 	if ($exe_type == 'group') {
		// 		$val = $process->executeGroup($data);
		// 		$url = $url . 'testgroup/curlExe';
		// 		$res = $client->serviceRequest($method, $url, $headers, $val);
		// 		return $res;
		// 	}
		// } else {
		// 	return (object) array("status" => "Failed", "message" => "Problem while updating in application server");
		// }
	}

	public function generateErrorlogs($data)
	{

		try {
		if(!empty($data))
		{
			$iterationval=$data->iterationval;
			$iteration=$data->testCase;
			//echo json_encode($iteration[0]->$iterationval); exit();
				$i = 0;
					foreach ($iteration as $tc) {
						
						$case_data = $tc->$iterationval;
						
							foreach ($case_data as $cd) {
								
									foreach ($cd->testSteps as $step) {
									
									if(array_key_exists("errorLog", $step))
									{
									
								$error_array=array("step_result_id"=>$step->step_result_id,"browserLogs"=>$step->errorLog->browserLogs,"driverLogs"=>$step->errorLog->driverLogs,"exception"=>$step->errorLog->exception);
									

									return $error_array;
										
									}
								
							}
						}
						$i++;
					
		}
	}
}

catch (\Exception $e) {
			throw new Exception($e);
		}

	}	




	
/* CI/CD pipeline scripting*/
	public function validateThirdparty($data='')
	{
		try{

			if($data->userName=='')
			{
				return "Username is required";
			}
			if($data->password=='')
			{
				return "Password is required";
			}
			if($data->type=='')
			{
				return "Excution type is required";
			}
			if($data->executionId=='')
			{
				return "Excution Id is required";
			}
			if($data->browserTypeName=='')
			{
				return "browser Type Name is required";
			}

		}catch(\Exception $e)
		{

			throw new Exception($e->getMessage());

		}
	}

	public function getThirdpartycases($data='')
	{
		try{
			$headers = [
			'Content-Type' => 'application/json',
			//'Authorization' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbmlkIjoiMSIsInRlbmFudElkIjoiMSIsImZpcnN0bmFtZSI6IlVzZXIiLCJsYXN0bmFtZSI6IiIsInJvbGVzIjpbeyJyb2xlSWQiOiIzIiwicm9sZU5hbWUiOiJVc2VyIn1dLCJwcm9qZWN0cyI6W3sicHJvamVjdElkIjoiMSIsInByb2plY3RuYW1lIjoiY2FwaXRhbCBiYW5pa2luZyIsImppcmFFbmFibGUiOm51bGx9XSwibG9naW50aW1lIjoxNTQ0NzY5MTMxfQ.vqRf311l5OtH3G5uJH5OJ5hyWUjjI-2KFRuZJvyB6iI',
		];
			$method = $this->config->getData('service_method.post_method');
			$autopropel_url = $this->config->getData('autopropel.app_url');
			$endpoint = $this->config->getData('service_endpoints.runthirdparty');
			$getrequest = $this->serviceRequest($method,$autopropel_url,$headers,$endpoint,$data);
	
			$status = $getrequest->result;
			if($status->messages == 'loginFailed')
			{

				return false;
			}
			if($status->messages=='InvalidId')
			{

				return array("msg"=>"Invalid Execution Id");
			}
			if($status->messages=='InvalidprojectId')
			{

				return array("msg"=>"Execution Id not mapped with user project");
			}

			$third__party_result = $this->iniateThirdparty($getrequest->result);
			$third__party_result->user_id = $getrequest->result->result->user_id;
			$third__party_result->token = $getrequest->result->result->token;
			
			return $third__party_result;
			
		}
		catch(\Exception $e)
		{
			throw new Exception($e->getMessage());
		}
	}
	
	
	public function iniateThirdparty($execution_data='')
	{ 
		try{
			
			if($execution_data!='')
			{
				$headers = [
			'Content-Type' => 'application/json',
			'Authorization' => $execution_data->result->token,
		];
		$method = $this->config->getData('service_method.post_method');
		$autopropel_url = $this->config->getData('autopropel.app_url');
		$endpoint = $this->config->getData('service_endpoints.initiatethirdparty');
		$execution_data = $this->serviceRequest($method,$autopropel_url,$headers,$endpoint,$execution_data->result);
	
		$json_data = json_encode($execution_data->result);

		$exec_result = $this->get_cases($json_data,true);

		return $exec_result;
			}
		}catch(\Exception $e)
		{
			throw new Exception($e->getMessage());
			
		}

	} 
	
	
	public function sendSlackMessage($slackData)
	{ 
	
		try{
	
	        //$slackData = (Object)$slackArrData;
			if($slackData!='')
			{
				$headers = [
					'Content-Type' => 'application/json',
					'Authorization' => $slackData['token'],
				];
				$method = $this->config->getData('service_method.post_method');
				$autopropel_url = $this->config->getData('autopropel.app_url');
				$endpoint = $this->config->getData('service_endpoints.sendSlackMessage');
				$execution_data = $this->serviceRequest($method,$autopropel_url,$headers,$endpoint,$slackData);
				//$json_data = json_encode($execution_data->result);
				//$exec_result = $this->get_cases($json_data,true);
				return $execution_data;
			}
		}catch(\Exception $e)
		{
			throw new Exception($e->getMessage());
			
		}

	}
	
	


	protected function serviceRequest($method, $url, $headers, $endpoint, $data) {
		try {
			if (isset($url) && isset($endpoint) && isset($data)) {
				$url = $url . $endpoint;
				$client = new \Requesthandler();
				$res = (object) $client->serviceRequest($method, $url, $headers, $data);
				return $res;
				if ($res->result->status == 'SUCCESS') {
					return $res->result->result;
				}
			}
		} catch (\Exception $e) {
			throw new Exception($e);
		}
	}

	public function curl_request($curl_data, $url) {

		$postdata = json_encode($curl_data);
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Content-Type: application/json',
			'Content-Length: ' . strlen($postdata)));

		$server_output = curl_exec($ch);
		curl_close($ch);

		return $server_output;
	}
}
?>