<?php
 defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));
require_once BASE_PATH.'/MobileWebsiteTest.php';
require_once BASE_PATH.'/Autopropeltest.php';
require_once BASE_PATH.'/MobileAppTest.php'; 
 
class Localagent { 
	public function __construct() { 
		$this->config=new Configs();    
    } 
	public function run_local($data_para) {
		$data = json_decode($data_para); 
		if ($data->result->environmentId == 1) {
			$Selenium = new Autopropeltest();
			$curl_update = $this->processInit($data, $Selenium); 
			return $curl_update; 
		} else if ($data->result->environmentId == 2) {
			if ($data->result->platformId == 4 && $data->result->applicationId == 3) {
				$appium = new MobileWebsiteTest();
			} 
            else if ($data->result->platformId == 4 && $data->result->applicationId == 2) 
            { 
				$appium = new MobileAppTest();
			} 
			$curl_update = $this->processInit($data, $appium);
			return $curl_update;

		} else {
			return array("msg" => "Invalid input");
		}

	} 
	public function processInit($data, $process) { 

		$exe_type = $data->result->executionType;
		$url = $data->result->serviceUrl;
		$method=$this->config->getData('server_info.post_method'); 
		$val='';
		$headers=[
			'Content-Type' => 'application/json', 
			'Authorization' => $data->result->request_handler
		]; ; 
		if(isset($data->result->request_handler)){

			$client = new \Requesthandler();    
			$url = $url . 'testsuite/groupExe'; 
			 
			if ($exe_type == 'suite') {   
				$suiteReference=$this->initiateTestResult($method,$headers,$data);  
				if($suiteReference){
					foreach ($data->result->testGroup as $key => $value) {
						$val=(object)$process->Groupexecutions($value,$data->result->browserTypeId); 
						$val->reference_id=$suiteReference; 
						$res=$client->serviceRequest($method,$url,$headers,$val);  
					}
					return $res; 
				}
			}

			if ($exe_type == 'group') { 
				$val = $process->executeGroup($data);
				$url = $url . 'testgroup/curlExe';
				$res=$client->serviceRequest($method,$url,$headers,$val); 
				return $res;
			}
    	}else{
    		return (object)array("status"=>"Failed","message"=>"Problem while updating in application server");
    	}
	}

	protected function initiateTestResult($method,$headers,$data){
		try{
			if(isset($data)){ 


				$url=$this->config->getData('server_info.result_init_url'); 
				
				$client = new \Requesthandler();     
	        	$res=(object)$client->serviceRequest($method,$url,$headers,$data->result);   

	        
	        	if($res->result->status == 'SUCCESS'){ 
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