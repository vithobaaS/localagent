<?php   
 defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));
require BASE_PATH.'/library/config/configs.php';
require BASE_PATH.'/library/request/Requesthandler.php';
require BASE_PATH.'/library/filetransfer/FileTransferModule.php';
 
class FileTransferCron {
	public function __construct() { 
		$fileTransfer=new FileTransferModule(); 
		//print_r($fileTransfer); exit();
        $res = $fileTransfer->checkfileuploadprocess();  
    }     
}

$cron=new FileTransferCron();

  

?>