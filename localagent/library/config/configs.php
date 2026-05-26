<?php 
class Configs{
	public function __construct() {
		$this->configdata=include('config.php'); 
    }

    public function getData($value){
    	try{
    		$retData='';
    		if(isset($value)){
				$datavalues=explode('.', $value); 
				$arraylen=count($datavalues); 
				for($incr=0; $incr<$arraylen;$incr++){
					if(!empty($retData)){
						if(isset($retData[$datavalues[$incr]])){
							$retData=$retData[$datavalues[$incr]];
						} 
					}else{
						$retData=$this->configdata[$datavalues[$incr]];
					} 	
				}  
			}
			return $retData;

    	} catch (\Exception $e) { 
    		throw new Exception($e); 
    	}
    }
	
}