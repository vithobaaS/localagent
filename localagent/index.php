<?php

header('Access-Control-Allow-Origin:*');
header('Access-Control-Allow-Headers:X-Request-With');

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

require 'vendor_slim/autoload.php';

require_once 'library/scheduler/SchedulerModule.php';
require_once 'library/localagent/Localagentrun.php';
require_once 'library/filetransfer/FileTransferModule.php';
require_once 'library/localagent/Autodriverrun.php';

$settings = [
	'settings' => [
		'displayErrorDetails' => true,
	],
];
// Slim framework intance
//$c = new \Slim\Container($configuration);

$app = new Slim\App($settings);

$container = $app->getContainer();

$container['errorHandler'] = function ($c) {
	return function ($request, $response, $exception) use ($c) {
		// log error here

		$msg = $exception->getMessage();
		return $c['response']->withStatus(500)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode($msg));
	};
};
$container['phpErrorHandler'] = function ($c) {
	return function ($request, $response, $error) use ($c) {
		// log error here
		$msg = $error->getMessage();
		// $res=array();
		return $c['response']->withStatus(500)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode($msg));
	};
};

$app->get('/checkavailstatus', function ($request, $response) {
	return $response->withStatus(200)
		->withHeader('Content-Type', 'application/json')
		->write(json_encode(array("status" => "Success", "message" => "workingfine")));
});

$app->get('/exception', function ($req, $res, $args) {
	// errorHandler will trap this Exception
	throw new Exception("An error happened here");
});

// To disable cross origin problems
$corsOptions = array(
	"origin" => "*",
	"exposeHeaders" => array("Content-Type", "X-Requested-With", "X-authentication", "X-client"),
	"allowMethods" => array('GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'),
);

$app->post('/createschedule', function ($request, $response) {
	$data = json_decode(file_get_contents('php://input'));
	$scheduler = new SchedulerModule();
	$res = $scheduler->createSchedule($data);
	if ($res) {
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "SUCCESS", "messages" => "Scheduler created successfully")));
	} else {
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Problem while creating schedule in localagent")));
	}
});

$app->get('/syncfiles', function ($request, $response) {
	$fileTransfer = new FileTransferModule();
	$res = $fileTransfer->checkfileuploadprocess();
	if ($res) {
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "SUCCESS", "messages" => "Screen shots moved successfully")));
	} else {
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Problem while creating schedule in localagent")));
	}
});

$app->post('/uploadresultdata', function ($request, $response) {
	$data = json_decode(file_get_contents('php://input'));
	$scheduler = new SchedulerModule();
	$res = $scheduler->createSchedule($data);
	if ($res) {
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "SUCCESS", "messages" => "Scheduler created successfully")));
	} else {
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Problem while creating schedule in localagent")));
	}
});

$app->post('/updateschedule', function ($request, $response) {
	$data = json_decode(file_get_contents('php://input'));
	$scheduler = new SchedulerModule();
	$res = $scheduler->updateSchedule($data);
	if ($res) {
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "SUCCESS", "messages" => "Scheduler updated successfully")));
	} else {
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Problem while updating schedule in localagent")));
	}
});

$app->post('/deleteschedule', function ($request,$response) {

	$data = json_decode(file_get_contents('php://input'));		
	$scheduler = new SchedulerModule();
	$res = $scheduler->deleteSchedule($data);
	if ($res) {
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "SUCCESS","code" => 200, "messages" => "Scheduler deleted successfully")));
	} else {
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Problem while deleting schedule in localagent")));
	}
});



/* CI/CD pipeline scripting end point*/

$app->post('/thirdpartyexecution', function ($request, $response) {
	

	$data = json_decode(file_get_contents('php://input'));
	//print_r($data);
	//exit;
	$localagent = new Localagentrun();
	$validate = $localagent->validateThirdparty($data);
	
	if($validate)
	{
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode($validate));

	}
	

	$return_val = $localagent->getThirdpartycases($data);
	if(!$return_val)
	{
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => "Invalid Username / Password")));

	}
	
	if(!is_object($return_val) && $return_val['msg']!='')
	{
		return $response->withStatus(400)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "FAILED", "messages" => $return_val['msg'])));
	}
	
	if($return_val->status=='SUCCESS')
	{

		// Send Slack Message Initiate.
		$slackData = array('user_id' => $return_val->user_id,'token' => $return_val->token,'type' => $data->type,'executionId' => $data->executionId);

		$slack_val = $localagent->sendSlackMessage($slackData);
		
		return $response->withStatus(200)
			->withHeader('Content-Type', 'application/json')
			->write(json_encode(array("status" => "Success", "messages" => "Execution result updated successfully")));
	}
	
	//return $response->write($return_val);
	
});


$app->post('/', function ($request, $response) {
	$data = file_get_contents('php://input');
	//echo $data; exit();
	$result = json_decode($data);

	if($result->result->environmentName != "Mobile" && $result->result->environmentName !="Mobile Website")
	{
		$initDriver=new Autodriverrun($result); 
	}

	$localagent = new Localagentrun();
	$result = $localagent->get_cases($data);
	return $response->withStatus(200)
		->withHeader('Content-Type', 'application/json')
		->write(json_encode($result));
});

/* 
 * Direct Order Endpoint
 * This allows you to send the full JSON test steps directly to the agent.
 */
$app->post('/run', function ($request, $response) {
	error_log("Order received! Starting automation...");
	$data = file_get_contents('php://input');
	$result = json_decode($data);

	if($result->result->environmentName != "Mobile" && $result->result->environmentName !="Mobile Website")
	{
		$initDriver = new Autodriverrun($result); 
	}

	$localagent = new Localagentrun();
	// Executes the JSON data directly
	$testResult = $localagent->run_local($result, $result->result->referenceId ?? 'direct_run');

	return $response->withStatus(200)
		->withHeader('Content-Type', 'application/json')
		->write(json_encode($testResult));
});



function responseData($result, $response) {
	return $response->withStatus(200)
		->withHeader('Content-Type', 'application/json')
		->write(json_encode($result));
}



$app->run();
?>
