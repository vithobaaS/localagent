<?php
return [
	'baseSetting' => [
		'baseUrl' 	=> 'http://local.autopropel.com:81/v2/rest/api/',
		'version' 	=> 'v2',
		'endPoint' 	=> 'rest/api/',
		'get' 		=> 'GET',
		'post' 		=> 'POST',
	],
	'database' => [
		'adapter' 	=> 'Mysql',
		'host' 		=> 'localhost',
		'username' 	=> 'root',
		'password' 	=> 'root',
		'dbname' 	=> 'autopropel_localagent',
		'charset' 	=> 'utf8',
	],
	'table' => [
		'scheduler' => 'scheduler',
	], 
	'service_endpoints' => [
		'schedule_details' 			=> 'schedule/getdetails',
		'update_schedule_status' 	=> 'schedule/updatestatus',
		'init_suite' 				=> 'testsuite/resultinit',
		'suite_execute' 			=> 'testsuite/groupExe',

	//	'suite_execute' 			=> 'rest/api/testsuite/groupExe',
		'group_execute' 			=> 'testgroup/curlExe',
		'get_case_url' 				=> 'testgroup/executenew',
		'group_case_up' 			=> 'testgroup/updatenew',
		'update_result' 			=> 'testgroup/updatetesresult',
		'screenshot_upload'			=> 'testcase/fileupload',
		'dynamic_action'			=>'testgroup/dynamicaction',
		'runthirdparty'				=>'cipipelinescripting/validate',
		'initiatethirdparty'		=>'execute/initiate',
		'sendSlackMessage'      	=> 'sendSlackMessage'
	],
	'service_method' => [
		'get_method' 	=> 'GET',
		'post_method' 	=> 'POST',
	],
	'autopropel'=>[
		"app_url"=>"https://service.aut	opropel.com/v2/rest/api/",
		"local_url"=>"http://local.autopropelapiold.com:81/v2/rest/api/",
		"dev_url"=>"http://192.168.5.23:82/v2/rest/api/",

	],
	'status' => [
		'active' 	=> 1,
		'inactive' 	=> 0,
	],
	'executionData' => [
		'desktop' 	=> 1,
		'mobile' 	=> 2,
	],
	'environmentType' => [
		'desktop' 	=> 1,
		'mobile' 	=> 2,
	],
	'platformType' => [
		'Windows' 	=> 1,
		'Linux' 	=> 2,
		'IOS' 		=> 3,
		'Android' 	=> 4,
	],
	'applicationType' => [
		'Website' 			=> 1,
		'Native' 			=> 2,
		'MobileWebsite' 	=> 3, 
	],

	'screen_shot_path' 	=> [
		'path' 			=> 	'screenshot',
		'driverpath'	=> 	'DriverFiles',
		'temppath' 		=>	'screenshot/temp',
		'max_count'		=> 15
	],
	'selenium_driver' => [
		'driver' => 'selenium-server-standalone-3.4.0.jar',
		'chrome' => ''
	]

];
