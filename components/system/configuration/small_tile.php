<div style="text-align:right">
  <a href="#" class="refresh" onclick="refresh_small('configuration', 'sys')"> </a>
</div>
<?php include_once('/pineapple/includes/api/tile_functions.php'); ?>
DNSSpoof<help id='configuration:small_dnsspoof'></help> <?=(exec("ps -all | grep [d]nsspoof") != '' ? '<font color="lime">Enabled</font>.&nbsp' : '<font color="red">Disabled</font>.')?> | <?=(exec("ps -all | grep [d]nsspoof") != '' ? '<b><a href="#sys/configuration/dnsspoof/stop/reload_config">Stop</a></b>' : '<b><a href="#sys/configuration/dnsspoof/start/reload_config">Start</a></b>')?>
<br />
Cron<help id='configuration:small_cron'></help> <?=(exec("ps -all | grep [c]ron") != '' ? '<font color="lime">Enabled</font>.&nbsp' : '<font color="red">Disabled</font>.')?>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| <?=(exec("ps -all | grep [c]ron") != '' ? '<b><a href="#sys/configuration/cron/stop/reload_config">Disable</a></b>' : '<b><a href="#sys/configuration/cron/start/reload_config">Enable</a></b>')?>


<script type="text/javascript">
  function reload_config(){
    refresh_small('configuration', 'sys');
  }
</script>