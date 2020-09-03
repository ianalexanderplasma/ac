var json_obj;

// Get ready to translate uploaded xlsx file into JSON object
$(document).ready(function(){
      $("#fileUploader").change(function(evt){
            var selectedFile = evt.target.files[0];
            var reader = new FileReader();
            reader.onload = function(event) {
              var data = event.target.result;
              var workbook = XLSX.read(data, {
                  type: 'binary'
              });
              workbook.SheetNames.forEach(function(sheetName) {
                
                  var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                  var json_object = JSON.stringify(XL_row_object);
                  
                  json_obj = JSON.parse(json_object);

                  // Convert excel dates to JS Date objects
                  for (var i = 0; i < json_obj.length; i++) {
                    json_obj[i].DATE = ExcelDateToJSDate(json_obj[i].DATE);
                    var month = json_obj[i].DATE.getMonth().toString();
                    var year = json_obj[i].DATE.getFullYear().toString();
                    var date_id = year+'-'+month;
                    json_obj[i].TD = date_id;
                    
                  }

                })

              createTable();
              document.getElementById('fileUploader').style.display = 'none';
              document.body.style.background = '#000';
            };

            reader.onerror = function(event) {
              console.error("File could not be read! Code " + event.target.error.code);
            };

            reader.readAsBinaryString(selectedFile);

      });
});


// Function to convert excel dates to JS Date objects
function ExcelDateToJSDate(serial) {
  var utc_days  = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;                                        
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function symbolize(type, pdm_adm){

  var symbol = '';

  switch (type) {

  case 'Meeting':
    symbol = '<i class="far fa-calendar"><br><span></span></i>';
    break;
  case 'Memo':
    if (pdm_adm == undefined){
      pdm_adm = '???';
    }
    symbol = '<i class="far fa-file-alt pdm"><br><span>'+pdm_adm+'</span></i>';
    break;
  case 'BB3 Storm':
    symbol = '<i class="fas fa-users"><br><span></span></i>';
    break;
  case 'PDM':
    symbol = '<i class="fas fa-crown pdm"><br><span>'+pdm_adm+'</span></i>';
    break;
  case 'PDM Prep':
    symbol = '<i class="fas fa-tools pdm"><br><span></span></i>';
    break;
  case 'ADM':
    symbol = '<i class="fas fa-crown adm"><br><span>'+pdm_adm+'</span></i>';
    break;
}
return symbol;
}


function getContexts(){
    const contexts = [...new Set(json_obj.map(x => x.CONTEXT))].sort();
    return contexts;
}

function getDateRange(){
    const dates = [...new Set(json_obj.map(x => x.TD))].sort();
    return dates;
}


function humanizeTD(td){
  var year = td.substring(0, 4);
  var month = convertMonth(td.slice(5));
  var metadata = month +' '+year;

  return metadata;
}

var context_obj = {};


function createTable(){

  var context_array = getContexts();
  context_obj = context_array.reduce((a,b)=> (a[b]={},a),{});

  for (key in context_obj) {
    if (context_obj.hasOwnProperty(key)) {
        context_obj[key] = { 'Meeting': 0, 'Memo': 0, 'BB3 Storm': 0, 'PDM': 0, 'PDM Prep': 0, 'ADM': 0, 'Touch': 0};
    }
  }
  //console.log(context_obj);
  var date_range = getDateRange();
  var legend  = document.getElementById('legend');
  var table  = document.getElementById('chart');
  var tr = table.insertRow();
  var th = document.createElement('th');
  tr.appendChild(th);

  // add date column headings
  for (var r = 0; r < date_range.length; r++) {

    var th = document.createElement('th');      
      
    th.id = date_range[r];
    th.innerHTML = '<h3>'+humanizeTD(date_range[r])+'</h3>';
    tr.appendChild(th);
  }

  // for each context, create row

  for (var c = 0; c < context_array.length; c++) {

    var tr = table.insertRow();
    var td_head = tr.insertCell();
    tr.classList.add("grabable");
    tr.id = context_array[c];
    td_head.innerHTML = '<h3>'+context_array[c]+'</h3><span id="'+context_array[c]+'" class="count" title="Click to view counts" onclick="alertCounts(this.id);">View counts</span>';


    // add toggle UI based on context rows
    createToggle(context_array[c]);

    for (var d = 0; d < date_range.length; d++) {

      var td = tr.insertCell();
      td.classList.add("cell");

      for (var i = 0; i < json_obj.length; i++) {

        if (json_obj[i].CONTEXT == context_array[c] && json_obj[i].TD == date_range[d]){

          // ADD counts to context_obj
          var instance_context = json_obj[i].CONTEXT;
          var instance_type = json_obj[i].TYPE;
          context_obj[instance_context][instance_type] += 1;
          
          var month = json_obj[i].DATE.getMonth() + 1;
          var date = json_obj[i].DATE.getDate()+ 1;
          var year = json_obj[i].DATE.getFullYear().toString();
          
          var date_str = month+'/'+date+'/'+year;
          var metadata = json_obj[i].TYPE +': '+date_str;
          td.innerHTML += '<span title="'+metadata+'">'+symbolize(json_obj[i].TYPE, json_obj[i].PDM_ADM)+'</span>';
        }
      }
    }
  }
  stripe();
  table.style.display="table";
  legend.style.display="block";
  draggable();
}

function alertCounts(id){
  var parsed = JSON.stringify(context_obj[id], null, 4);
  var a_string = parsed.replace('{','');
  var b_string = a_string.replace('}','');
  var c_string = b_string.replaceAll('"','');
  var d_string = c_string.replaceAll(',','');
  
  alert(id+':'+d_string);

}

function createToggle(id) {
  var div = document.getElementById('toggles');
  var p = document.createElement('p');
  var input = document.createElement('input');
  p.innerHTML = id;
  p.style.display = 'inline-block';
  input.type = 'checkbox';
  input.checked = true;
  div.appendChild(p);
  div.appendChild(input);
  input.addEventListener('change', function() { toggle(id)});
}

function toggle(id) {
  var x = document.getElementById(id);
  if (x.style.display === "none") {
    x.style.display = "table-row";
  } else {
    x.style.display = "none";
  }
  stripe();
}

function stripe(){
  var table = document.getElementById("chart");
  var counter = 0;
  
  for (var i = 0, row; row = table.rows[i]; i++) {

    if (row.style.display == 'none'){
    }  else {
      counter++;
      if (counter%2 == 0){
        row.style.background = '#f2f2f2';
      } else {
        row.style.background = '#fff';
      }
    }
  }
}


function convertDay(day){
  
  switch (day) {
    case 0:
      var dow = 'Sun';
      break;
    case 1:
      var dow = 'Mon';
      break;
    case 2:
      var dow = 'Tue';
      break;
    case 3:
      var dow = 'Wed';
      break;
    case 4:
      var dow = 'Thu';
      break;
    case 5:
      var dow = 'Fri';
      break;
    case 6:
      var dow = 'Sat';
      break;
  }
  return dow;
}

function convertMonth(month){

  var num = parseInt(month);
  
  switch (num) {
    case 0:
      var m = 'Jan';
      break;
    case 1:
      var m = 'Feb';
      break;
    case 2:
      var m = 'Mar';
      break;
    case 3:
      var m = 'Apr';
      break;
    case 4:
      var m = 'May';
      break;
    case 5:
      var m = 'Jun';
      break;
    case 6:
      var m = 'Jul';
      break;
    case 7:
      var m = 'Aug';
      break;
    case 8:
      var m = 'Sep';
      break;
    case 9:
      var m = 'Oct';
      break;
    case 10:
      var m = 'Nov';
      break;
    case 11:
      var m = 'Dec';
      break;
  }
  return m;
}

function draggable(){
  
  $('.table-dragable tbody .grabable').mousedown(function (e) {

    var tr = $(e.target).closest('tr'), sy = e.pageY, drag;
    if ($(e.target).is('tr')) tr = $(e.target);
    var index = tr.index();
    $(tr).addClass('grabbed');

    function move (e) {
      if (!drag && Math.abs(e.pageY - sy) < 10) return;
      drag = true;
      tr.siblings().each(function() {
        var s = $(this), i = s.index(), y = s.offset().top;
        if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
          if (i < tr.index()) s.insertAfter(tr);
          else s.insertBefore(tr);
          return false;
        }
      });
    }

    function up (e) {
      if (drag && index != tr.index()) {
        drag = false;
      }
      $(document).unbind('mousemove', move).unbind('mouseup', up);
      $(tr).removeClass('grabbed');
      stripe();
    }
    $(document).mousemove(move).mouseup(up);
  });
}

function getCounts(){
  var arr = getContexts();
  var context_obj = arr.reduce((a,b)=> (a[b]={},a),{});
  console.log(context_obj);

  for (const property in context_obj) {
    context_obj.AFG = 0;
    //console.log(${property}: ${context_obj[property]});
    //console.log()
  }
  console.log(context_obj);
}
