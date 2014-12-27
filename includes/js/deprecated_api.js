/**
 * Created by leathalinjexion on 12/20/14.
 */


//handle deprecated global api
function notify(message, sender, color) {
    Pineapple.notify(message, sender, color);
}

function draw_small_tile(name, type) {
    Pineapple.draw_small_tile(name, type);
}

function hide_small_tile(name, persistent) {
    Pineapple.hide_small_tile(name, persistent);
}

function add_hidden_tile(tile) {
    Pineapple.add_hidden_tile(tile);
}

function update_tile(name, type, data) {
    Pineapple.update_tile(name, type, data);
}

function refresh_small(name, type) {
    Pineapple.refresh_small(name, type);
}

function popup(message) {
    Pineapple.popup(message);
}

function close_popup() {
    Pineapple.close_popup();
}

function draw_large_tile(name, type, data) {
    Pineapple.draw_large_tile(name, type, data);
}

function hide_large_tile() {
    Pineapple.hide_large_tile();
}

function handle_hash_change(hashValue) {
    Pineapple.handle_hash_change(hashValue);
}

function toggle_notifications(){
    Pineapple.toggle_notifications();
}

function get_tab(link, callback){
    Pineapple.get_tab(link, callback);
}

function select_tab_content(tab){
    Pineapple.select_tab_content(tab);
}

function refresh_current_tab(callback){
    Pineapple.refresh_current_tab(callback);
}

function toggle_views(){
    Pineapple.toggle_views();
}

function select_view(view){
    Pineapple.select_view(view);
}

function toggle_hidden_bar_mobile(){
    Pineapple.toggle_hidden_bar_mobile()
}

function  load_tiles(){
    Pineapple.load_tiles();
}

function populate_hidden_tiles(){
    Pineapple.populate_hidden_tiles();
}


function clear_notifications(){
    Pineapple.clear_notifications();
}