//region {variables and functions}
const timeId = "time";
const dateId = "date";
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "May",
  "Apr",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const consoleGreeting = "Hello World! - from popup_script.js";

function setTimeAndDate(timeElement, dateElement) {
  let date = new Date();
  const minutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
  const time = date.getHours() + ":" + minutes;
  //In "date.getMonth", 0 indicates the first month of the year
  //In "date.getDay", 0 represents Sunday
  date =
    days[date.getDay()] +
    ", " +
    months[date.getMonth()] +
    " " +
    date.getDate() +
    " " +
    date.getFullYear();
  timeElement.innerHTML = time;
  dateElement.innerHTML = date;
}
//end-region

//region {calls}
console.log(consoleGreeting);
document.addEventListener("DOMContentLoaded", function (dcle) {
  const timeElement = document.getElementById(timeId);
  const dateElement = document.getElementById(dateId);
  setTimeAndDate(timeElement, dateElement);
});
//end-region
