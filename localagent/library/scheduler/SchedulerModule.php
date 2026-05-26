<?php 
/*
* @FileName          : SchedulerModule.php
* @Class             : SchedulerModule
* Model Name         : -
* Description        : This model is used to perform CRUD operation for scheduler
* Module             : scheduler
* Actors             : -
* @author            : surrender.kumaragurusamy@qruize.com
* @CreatedDate       : 18 AUG 2018
* @LastModifiedDate  : 07 DEC 2018
* @LastModifiedBy    : surrender.kumaragurusamy@qruize.com
* @LastModifiedDesc  :
* Features           :
*/
 defined('BASE_PATH') || define('BASE_PATH', getenv('BASE_PATH') ?: realpath(dirname(__FILE__) . '/../..'));  
require 'SchedulerModel.php';
require BASE_PATH.'/library/config/configs.php';
require BASE_PATH.'/library/request/Requesthandler.php';
 

class SchedulerModule{ 
	public function __construct() {
		$this->config=new Configs();   
		$this->scheduler_mdl=new SchedulerModel();   
    }


    /**
    * @MethodName : createSchedule()
    *
    * @Desc : This method is used  to create schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:createSchedule()
    */
    public function createSchedule($data)
    {
    	try{
            $inputValues=[];
    		if(isset($data)){ 
                foreach ($data as $key => $value) {
                    if(!empty($value->scheduleTime) && !empty($value->token)){  
                        $datevalue=date('d_m_Y',strtotime($value->scheduleTime));
                        $insert['id']=mt_rand().strtotime(date('Y-m-d H:i:s'));
                        $insert['schedule_time']=date('Y-m-d H:i:s',strtotime($value->scheduleTime));
                        $insert['schedule_details']=$value->token;
                        $insert['created_by']=0;
                        $insert['created_date']=date("d-m-Y H:i:s");
                        $insert['updated_date']=date("d-m-Y H:i:s");
                        $insert['status']=0;
                        $inputValues[$datevalue][]=$insert;
                    } 
                }  
                $res=$this->scheduler_mdl->create_scheduler($inputValues); 
    			return $res;
 
    		} 
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }

    /**
    * @MethodName : updateSchedule()
    *
    * @Desc : This method is used  to update schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:updateSchedule()
    */
    public function updateSchedule($data)
    {
    	try{
    		if(isset($data) && !empty($data->scheduleTime) && !empty($data->token)){  
                if(isset($data->oldScheduleTime)){
                    $update['old_schedule_time']=date('Y-m-d H:i:s',strtotime($data->oldScheduleTime));
                }
                
    			$update['schedule_time']=date('Y-m-d H:i:s',strtotime($data->scheduleTime));
    			$update['schedule_details']=$data->token;
                 
    			$res=$this->scheduler_mdl->update_scheudlerDetails($update,"Update");
                
    			return $res;
 
    		} 
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }

    /**
    * @MethodName : deleteSchedule()
    *
    * @Desc : This method is used  to delete schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:deleteSchedule()
    */
    public function deleteSchedule($data)
    {
    	try{
    		if(isset($data) && !empty($data->schedule_time) && !empty($data->token)){  

                $update['schedule_time']=date('Y-m-d H:i:s',strtotime($data->schedule_time));
                $update['schedule_details']=$data->token;
                 
                $res=$this->scheduler_mdl->update_scheudlerDetails($update,"Delete");
                
                return $res;
 
            }  
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }

    /**
    * @MethodName : getscheduleInfo()
    *
    * @Desc : This method is used  to get schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:getscheduleInfo()
    */
    public function getscheduleInfo(){
        try{
            $scheduler_mdl=new SchedulerModel();   
            $res=$scheduler_mdl->getscheduleInfo();
            return $res;
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }


    /**
    * @MethodName : updateScheduleStatus()
    *
    * @Desc : This method is used  to update schedule status schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:updateScheduleStatus()
    */
    public function updateScheduleStatus($id,$filepath){
        try{
            if(isset($id)){

                $scheduler_mdl=new SchedulerModel();   
                $res=$scheduler_mdl->updateExecutionStatus($id,$filepath);
                if($res){
                    $schdlData=$scheduler_mdl->getScheduleById($id);
                    if(!empty($schdlData)){
                        return $this->updateAppStatus($schdlData['token']);
                    }
                    
                }  
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    protected function updateAppStatus($token){
        try{
            if(isset($token)){
                $headers=[
                        'Content-Type' => 'application/json', 
                        'Authorization' => $token
                    ]; 
                $method=$this->config->getData('service_method.get_method');
                $baseUrl=$this->config->getData('baseSetting.baseUrl');
                $url=$baseUrl . $this->config->getData('service_endpoints.update_schedule_status');
                $serRequest=$this->serviceRequest($method,$url,$headers);
                if(isset($serRequest)){
                   if($serRequest->result->status=='SUCCESS'){ 
                        return true; 
                    }else{
                        return false;
                    } 
                }else{
                    return false;
                } 
                
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    public function serviceRequest($method,$url,$headers,$data=''){
        try{
            $client = new \Requesthandler();     
            $res=$client->serviceRequest($method,$url,$headers,$data);
            return $res; 
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }      
    }

}

 

?>