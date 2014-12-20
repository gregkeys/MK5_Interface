<?php include_once('/pineapple/includes/api/tile_functions.php'); ?>
<?php

echo 'AutoSSH<help id="autossh:small_autossh"></help> ';
if(autoSSH_connected()) {
  echo "<font color=\"lime\">Connected</font>.&nbsp;&nbsp;&nbsp; | <a href='#sys/autossh/autossh/stop/refresh_autossh'>Disconnect</a>";
} else {
  echo "<font color=\"red\">Disconnected</font>. | <a href='#sys/autossh/autossh/start/refresh_autossh'>Connect</a>";
}

echo "<br />";

echo 'Autostart ';
if(autoSSH_autostart()) {
  echo "<font color=\"red\">Disabled</font>.&nbsp;&nbsp; | <a href='#sys/autossh/autossh/enable/refresh_autossh'>Enable</a>";
} else {
  echo "<font color=\"lime\">Enabled</font>.&nbsp;&nbsp;&nbsp; | <a href='#sys/autossh/autossh/disable/refresh_autossh'>Disable</a>";
}


function autoSSH_connected(){
  exec('pgrep autossh', $pids);
  if(empty($pids)){
    return false;
  }
  return true;
}

function autoSSH_autostart(){
  if(file_exists('/etc/rc.d/S80autossh')){
    return false;
  }
  return true;
}

?>

<script type="text/javascript">

function refresh_autossh(){
  refresh_small('autossh', 'sys');
}

</script>
