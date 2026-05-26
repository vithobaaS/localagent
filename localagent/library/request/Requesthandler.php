<?php 
 
require 'vendor/request_autoload.php'; 
 

class Requesthandler{   

    public function serviceRequest($method,$url,$headers,$data=''){
        try{
            if(isset($method) && isset($url) && isset($headers)){ 
                $client = new \GuzzleHttp\Client();     
                $res = $client->request($method,$url,array(
                        'headers' => $headers,
                        'body'   => json_encode($data)
                    )
                );   
                if($res->getStatusCode()==200){  

                   // print_r($res->getBody()); exit();

                    return (object)array("result"=>json_decode($res->getBody()));
                }else 
                {
                    return (object)array("status"=>"Failed","result"=>[]);
                }
            }else
            {
                return (object)array("status"=>"Failed","message"=>"Some data in request is missing");
            } 
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
             
    }

    public function serviceFileRequest($method,$url,$headers,$data=''){
        try{
            if(isset($method) && isset($url) && isset($headers)){ 
                $client = new \GuzzleHttp\Client();     
                $res = $client->request($method,$url,array(
                        'headers' => $headers,
                        'body'   => $data
                    )
                );   
                if($res->getStatusCode()==200){  

                   // print_r($res->getBody()); exit();

                    return (object)array("result"=>json_decode($res->getBody()));
                }else 
                {
                    return (object)array("status"=>"Failed","result"=>[]);
                }
            }else
            {
                return (object)array("status"=>"Failed","message"=>"Some data in request is missing");
            } 
        } catch (\Exception $e) { 
            throw new Exception($e); 
        }
             
    }

}

 

?>