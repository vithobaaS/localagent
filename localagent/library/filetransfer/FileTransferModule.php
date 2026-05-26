<?php   
/*
* @FileName          : FileTransferModule.php
* @Class             : FileTransferModule
* Model Name         : -
* Description        : Transfer file from local agent machine to the server with authentication
* Module             : -
* Actors             : -
* @author            : surrender.kumaragurusamy@qruize.com
* @CreatedDate       : 19 SEP 2018
* @LastModifiedDate  : 19 SEP 2018
* @LastModifiedBy    : surrender.kumaragurusamy@qruize.com
* @LastModifiedDesc  :
* Features           :
*/

 
class FileTransferModule {
	public function __construct() { 
		$this->config=new Configs();  
        $this->baseUrl=$this->config->getData('baseSetting.baseUrl');   
    }   

    /**
    * @MethodName : checkfileuploadprocess()
    *
    * @Desc : This method is used  to upload file from local agent service.
    * @Parameter : file content
    * @Return value : JSON Object
    * @Access Point : FileTransferModule:checkfileuploadprocess()
    */
    public function checkfileuploadprocess(){
        try{
            $dir=realpath(dirname(__FILE__) . '/../../..') .'/'. $this->config->getData('screen_shot_path.path');    
            $count= $this->config->getData('screen_shot_path.max_count');
            $boundary = uniqid();
            $delimiter = '-------------' . $boundary;
            $fileData = [];
            if (is_dir($dir)) {
                if ($dh = opendir($dir)) {
                    while (($file = readdir($dh)) !== false) {
                        if ($file != "." && $file != "..") {
                            if($count > count($fileData) && strpos(mime_content_type($dir.'/'.$file), 'image') !== false){  
                                $fileData[$file]=array(
                                    'file'=>file_get_contents($dir.'/'.$file),
                                    'type'=>mime_content_type($dir.'/'.$file),
                                    'name'=>$file,
                                );
                            } else{
                                break;
                            }  
                             
                        }
                    }
                    closedir($dh);
                }
            }
            $getPostData=$this->build_form_data($fileData,$delimiter);
            if(!empty($getPostData)){
                $result=$this->serviceRequest($getPostData,$delimiter);
                if(!empty($result)){
                    $this->removeMovedFiles($dir,$result);
                    return "File moved successfully";
                }else{
                    return "Problem while upload";
                }    
            }else{
                return "No data available";
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    } 

    protected function removeMovedFiles($dir,$data){
        try{
            if(!empty($dir)){
                if(isset($data->result->result) && !empty($data->result->result)){
                    foreach ($data->result->result as $key => $value) {
                        if($value->status){ 
                            unlink($dir.'/'. $value->file_name);
                         
                        }
                    }
                }
                 
            }
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }


    /**
    * @MethodName : serviceRequest()
    *
    * @Desc : This method is used send files to the app server
    * @Parameter : file content
    * @Return value : JSON Object
    * @Access Point : FileTransferModule:serviceRequest()
    */
    protected function serviceRequest($data,$delimiter){
        try{  
            $url=$this->baseUrl . $this->config->getData('service_endpoints.screenshot_upload');
            $method=$this->config->getData('service_method.post_method');  
            $headers=[
                'Authorization'     => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbmlkIjoxLCJ0ZW5hbnRJZCI6MSwiZmlyc3RuYW1lIjoiU3VyZW5kYXIiLCJsYXN0bmFtZSI6Imt1bWFyYWd1cnVzYW15IiwibG9naW50aW1lIjoxNTM3MjYzODkxfQ.QB1aEPYHKwPxdmc9GO6x5altnH27FqsJ9ibMryD3gxs',
                'Content-Type'      => 'multipart/form-data; boundary=' . $delimiter, 
                'Content-Length'    => strlen($data),  
                 
            ];  
            $client = new \Requesthandler();     
            $res=$client->serviceFileRequest($method,$url,$headers,$data);
            return $res; 
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }      
    }


    /**
    * @MethodName : build_form_data()
    *
    * @Desc : This method is used build form data for the post content of files
    * @Parameter : file content
    * @Return value : JSON Object
    * @Access Point : FileTransferModule:build_form_data()
    */
    protected function build_form_data($files,$delimiter){
        try{
            $postData = '';
            if(!empty($files)){ 
                $eol = "\r\n";  
                foreach ($files as $name => $content) {  
                    $postData .= "--" . $delimiter . $eol
                        . 'Content-Disposition: form-data; type="' . $content['type'] . '"; name="' . $name . '"; filename="' . $name . '"' . $eol
                        . 'Content-Type:'.$content['type'].$eol 
                        . 'Content-Transfer-Encoding: binary'.$eol
                        
                        ; 
                    $postData .= $eol;
                    $postData .= $content['file'] . $eol;
                }
                $postData .= "--" . $delimiter . "--".$eol; 
                
            }
            return $postData;
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
    }  
} 

?>