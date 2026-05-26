<?php
defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));
require_once BASE_PATH . '/Autopropeltest.php';

class AgentProcess {
	public function processInit($data, $process) {
		if (isset($data->result->request_handler)) {
			$headers = [
				'Content-Type' => 'application/json',
				'Authorization' => $data->result->request_handler,
			];
			$result = $this->executionProcess($data, $headers, $process);
			return $result;
		} else {
			return (object) array("status" => "Failed", "message" => "Problem while updating in application server");
		}
	}

	private function executionProcess($data, $headers, $process) {
		$exe_type = $data->result->executionType;
		$url = $data->result->serviceUrl;
		$method = 'POST';
		$val = '';
		if ($exe_type == 'suite') {
			$val = $process->executeSuite($data);
			$url = $url . 'rest/api/testsuite/curlExe';
		}

		if ($exe_type == 'group') {
			$val = $process->executeGroup($data);
			$url = $url . 'rest/api/testgroup/curlExe';
		}

		$client = new \Requesthandler();
		$res = $client->serviceRequest($method, $url, $headers, $val);
		return $res;
	}

}
?>