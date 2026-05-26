<?php   
 defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));
require BASE_PATH.'/library/scheduler/SchedulerModule.php';
require BASE_PATH.'/library/localagent/Localagentrun.php'; 
require BASE_PATH.'/library/localagent/Autodriverrun.php';  
 
class CronModule extends SchedulerModule{
	public function __construct() { 
		$this->config=new Configs();    
        $this->baseUrl=$this->config->getData('baseSetting.baseUrl');
    } 

    public function checkscheduler(){
    	try{  
    		$data=$this->getscheduleInfo();     
            $scheduleDetails=[];
    		if(!empty($data)){  
    			$url=$this->baseUrl . $this->config->getData('service_endpoints.schedule_details');
    			$method=$this->config->getData('service_method.get_method');  
    			foreach ($data as $key => $value) { 
    				$headers=[
							'Content-Type' => 'application/json', 
							'Authorization' => $value['schedule_details']
						];  
    				if($value['status'] ==  $this->config->getData('status.inactive') ){ 
                        $serRequest=$this->serviceRequest($method,$url,$headers);   
                        if($serRequest->result->status=='SUCCESS'){ 
                            if(!empty($serRequest->result)){
                                $serRequest->result->local_scheduleid=$value['id'];
                                $serRequest->result->updatepath=$value['update_path'];
                                $scheduleDetails[]=$serRequest->result;
                            }   
                            
                        } 
    				}	      
    			}
    		}     
            if(!empty($scheduleDetails)){ 
                foreach ($scheduleDetails as $key => $value) { 
                    try{   
                        $initDriver=new Autodriverrun($value); 
                        $obj = new Localagentrun();  
                        $result = $obj->get_cases(json_encode($value));   
                        $updateSchedule=$this->updateScheduleStatus($value->local_scheduleid,$value->updatepath); 
                    } catch (\Exception $e) { 
                        throw new Exception($e); 
                    }    
                }
            }else{  
                return "there is no schedule on current time";
            }  
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }   
}

$cron=new CronModule();

$cron->checkscheduler();
 

?>