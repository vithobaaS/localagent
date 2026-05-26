<?php   
/*
* @FileName          : SchedulerModel.php
* @Class             : SchedulerModel
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
class SchedulerModel{
	public function __construct() { 
		$this->config=new Configs();  
        $this->basePath=BASE_PATH."/library/scheduler/scheduleData/";
    }

    /**
    * @MethodName : connections()
    *
    * @Desc : This method is used  to create database connectitviy for the CRUD Operation
    * @Parameter : -
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:connections()
    */
    protected function connections(){
    	try{ 
	  //   	$hostname=$this->config->getData('database.host');
	  //   	$username=$this->config->getData('database.username');
	  //   	$pass=$this->config->getData('database.password');
	  //   	$dbname=$this->config->getData('database.dbname'); 
	  //   	$connections = new mysqli($hostname, $username, $pass, $dbname);
	  //   	if ($connections->connect_error) {
			//     die("Connection failed: " . $connections->connect_error);
			// }
	  //   	return $connections;
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }

    /**
    * @MethodName : create_scheduler()
    *
    * @Desc : This method is used  to create schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:create_scheduler()
    */
    public function create_scheduler($data){
        try{ 
            if(!empty($data)){ 
                foreach ($data as $key => $value) {
                    $dir= $this->basePath.$key;

                    if (is_dir($dir)){
                        $filewithpath=$dir.'/schedule.json';
                        if(file_exists($filewithpath)){
                            $oldContent = json_decode(file_get_contents($filewithpath));
                            $fileDetails=$this->updateScheduleContent($oldContent,$value);
                            $this->insertScheduleContent($filewithpath,$fileDetails);
                        } 
                    }else{
                        mkdir($dir, 0777, true);
                        $filewithpath=$dir.'/schedule.json';
                        $fileDetails=(object)[];
                        $fileDetails->schedulerInfo=$value;
                        $this->insertScheduleContent($filewithpath,$fileDetails);

                    } 
                } 
                return true;
            }else{
                return false;
            }
             
               
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    /**
    * @MethodName : update_scheudlerDetails()
    *
    * @Desc : This method is used  to update schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:update_scheudlerDetails()
    */
    public function update_scheudlerDetails($data,$type){
        try{
            if(!empty($data)){
                $datevalue=date('d_m_Y',strtotime($data['schedule_time']));
                $dir= $this->basePath.$datevalue."/schedule.json"; 
                if (is_dir($this->basePath.$datevalue)){
                    if(file_exists($dir)){
                        $filecontent = json_decode(file_get_contents($dir));
                        foreach ($filecontent->schedulerInfo as $key => $value) {

                            if($value->schedule_details == $data['schedule_details']){ 
                                if($type=="Update"){
                                    $filecontent->schedulerInfo[$key]->status=0;
                                }elseif ($type=="Delete") {
                                    $filecontent->schedulerInfo[$key]->status=3;
                                }
                                $filecontent->schedulerInfo[$key]->schedule_time=date('Y-m-d H:i:s',strtotime($data['schedule_time']));
                                $filecontent->schedulerInfo[$key]->updated_date=date("d-m-Y H:i:s");
                            }
                        }
                        $this->insertScheduleContent($dir,$filecontent); 
                        return true; 
                    }else{
                        return false;
                    } 
                }else{
                    mkdir($this->basePath.$datevalue, 0777, true);
 
                    $filewithpath=$dir;
                    $fileDetails=(object)[]; 
                    $insert['id']=mt_rand().strtotime(date('Y-m-d H:i:s'));
                    $insert['schedule_time']=date('Y-m-d H:i:s',strtotime($data['schedule_time']));
                    $insert['schedule_details']=$data['schedule_details'];
                    $insert['created_by']=0;
                    $insert['created_date']=date("d-m-Y H:i:s");
                    $insert['updated_date']=date("d-m-Y H:i:s");
                    $insert['status']=0; 
                    $fileDetails->schedulerInfo[]=$insert; 
                    $this->insertScheduleContent($filewithpath,$fileDetails);
                    if(isset($data['old_schedule_time'])){
                        $this->delete_schedulerDetails($data);
                    }
                    return true; 
                    
                }
            }else{
                return false;
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }


    
    /**
    * @MethodName : delete_schedulerDetails()
    *
    * @Desc : This method is used  to delete schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:delete_schedulerDetails()
    */
    public function delete_schedulerDetails($data){
        try{
            if(!empty($data)){
                $datevalue=date('d_m_Y',strtotime($data['old_schedule_time']));
                $dir= $this->basePath.$datevalue."/schedule.json"; 
                if(file_exists($dir)){
                    $filecontent = json_decode(file_get_contents($dir));
                    foreach ($filecontent->schedulerInfo as $key => $value) { 
                        if($value->schedule_details == $data['schedule_details']){  
                            $filecontent->schedulerInfo[$key]->status=3; 
                        }
                    } 
                    $this->insertScheduleContent($dir,$filecontent);
                    return true; 
                }else{
                    return false;
                } 
            }else{
                return false;
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    /**
    * @MethodName : insertScheduleContent()
    *
    * @Desc : This method is used  to insert  schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:insertScheduleContent()
    */
    protected function insertScheduleContent($dir,$filecontent){
        try{
            if(!empty($dir) && !empty($filecontent)){
                file_put_contents($dir,json_encode($filecontent));
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }


    /**
    * @MethodName : updateScheduleContent()
    *
    * @Desc : This method is used  to update new data  schedule in local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:updateScheduleContent()
    */
    protected function updateScheduleContent($oldContent,$newContent){
        try{
            if(!empty($oldContent) && !empty($newContent)){ 
                foreach ($newContent as $key => $value) {
                    array_push($oldContent->schedulerInfo, $value);
                }  
            }
            return $oldContent;
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

  	
    /**
    * @MethodName : insert_query()
    *
    * @Desc : This method is used  to inerserty query and update to mysql database in local machine  
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:insert_query()
    */
    public function insert_query($data,$tablename){ 
    	try{
			if(is_array($data)){
				$connections=self::connections();
				foreach($data as $key=>$value){ 
					$fields[] = '`'.$key.'`';
					if(is_numeric($value)){
						$values[] = $value;
					}else{
						$values[] = "'".$connections->real_escape_string($value)."'";	
					}
				}
				$sqlQuery="INSERT INTO ".$tablename."(".implode(",",$fields).") VALUES(".implode(",",$values).")"; 
				if(!$connections->query($sqlQuery)){
					return false;
				}else{
					return true; 
				} 
			}
		} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
	}


    public function update_query($data,$tablename,$conditions){
        if(is_array($data)){
        	$connections=self::connections();
        	foreach($data as $key=>$value){
        	
        		if(is_numeric($value)){
        			$values = $value;
        		}else{
        			$values = "'".$connections->real_escape_string($value)."'";	
        		}
        			$fields[] = '`'.$key.'` = '."".$values."";
        	}

        	foreach($conditions as $key=>$value){
        	
        		if(is_numeric($value)){
        			$values = $value;
        		}else{
        			$values = "'".$connections->real_escape_string($value)."'";	
        		}
        			$conditionData[] = '`'.$key.'` = '."".$values."";
        	}

        	$where=implode('AND', $conditionData);
        	 
        	$sqlQuery="UPDATE ".$tablename." SET ". implode(",",$fields)." WHERE  ".$where; 

        	if(!$connections->query($sqlQuery)){
				return false;
			}else{
				return true; 
			} 		
        }
    }

    /**
    * @MethodName : getscheduleInfo()
    *
    * @Desc : This method is used  to get schedule information from local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:getscheduleInfo()
    */
    public function getscheduleInfo(){
    	try{ 
            $resultData=[];
            $dir= $this->basePath.date("d_m_Y");
            if (is_dir($dir)){
              if ($dh = opendir($dir)){ 
                $scandir=scandir($dir,1); 
                $filewithpath=$dir.'/schedule.json';
                if(file_exists($filewithpath)){
                    $fileDetails = json_decode(file_get_contents($filewithpath));
                    $resultData=$this->getScheduleDetails($fileDetails,$filewithpath);

                } 
                closedir($dh);
              }
            } 
            return $resultData; 
    	} catch (\Exception $e) { 
    		throw new Exception($e); 
		}
    }

    /**
    * @MethodName : updateExecutionStatus()
    *
    * @Desc : This method is used  to update execution status schedule information to local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:updateExecutionStatus()
    */
    public function updateExecutionStatus($id,$filepath){
        try{    
            if(!empty($id) && file_exists($filepath)){
                $updateStatus=false;
                $fileDetails = json_decode(file_get_contents($filepath));
                if(!empty($fileDetails)){
                    foreach ($fileDetails->schedulerInfo as $key => $value) {
                         
                        if($value->id ==$id){
                            $updateStatus=true;
                            $fileDetails->schedulerInfo[$key]->status=1;
                            $fileDetails->schedulerInfo[$key]->updated_date=date("d-m-Y H:i:s");;
                        }
                    }
                    if($updateStatus){
                        $this->insertScheduleContent($filepath,$fileDetails);  
                    } 
                }   
            }    
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    /**
    * @MethodName : getScheduleDetails()
    *
    * @Desc : This method is used  to get schedule information to local machine and update information in filesystem
    * @Parameter : schedule info
    * @Return value : JSON Object
    * @Access Point : SchedulerModel:getScheduleDetails()
    */
    protected function getScheduleDetails($fileContent,$filewithpath=""){
        try{
            $resultData=[];
            if(!empty($fileContent)){ 
                $currentTime=date("d-m-Y H:i:s");
                foreach ($fileContent->schedulerInfo as $key => $value) {
                    $scheduleTime=date("Y-m-d H:i",strtotime($value->schedule_time));
                    if($scheduleTime==date("Y-m-d H:i") && $value->status==0){ 
                        if(!empty($filewithpath)){
                            $value->update_path=$filewithpath; 
                        }                        
                        $resultData[]=(array)$value;
                    } 
                   
                }
            } 
            return $resultData;
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

    public function getScheduleById($id){
        try{
            if(isset($id)){
                $connections=self::connections();
                $sqlQuery="SELECT  S.token as token, S.id as id FROM `scheduler` as S WHERE `id` ='".$id."'";
                $executequery=$connections->query($sqlQuery);
                return $executequery->fetch_assoc();
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }

}
?>