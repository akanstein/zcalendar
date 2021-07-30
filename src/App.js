import "./App.css";
import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const scopes =
  "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar";
const gapi = window.gapi;

function App() {
  const [events, setEvents] = useState([]);

  const signInPopup = () => {
    gapi.auth2.authorize(
      { client_id: process.env.REACT_APP_CLIENT_ID, scope: scopes },
      (res) => {
        if (res) {
          if (res.access_token)
            localStorage.setItem("access_token", res.access_token);

          // Load calendar events after authentication
          gapi.client.load("calendar", "v3", () => {
            gapi.client.calendar.events
              .list({
                // Fetch events from user's primary calendar
                key: process.env.REACT_APP_API_KEY,
                calendarId: "primary",
                showDeleted: true,
                singleEvents: true,
              })
              .then(function (response) {
                let events = response.result.items;

                if (events.length > 0) {
                  console.log(events);
                  setEvents(formatEvents(events));
                }
              });
          });
        }
      }
    );
  };

  useEffect(() => {
    gapi.load("client:auth2", () => {
      if (!localStorage.getItem("access_token")) {
        signInPopup();
      } else {
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${process.env.REACT_APP_API_KEY}&orderBy=startTime&singleEvents=true`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        )
          .then((res) => {
            // Check if unauthorized status code is returned
            if (res.status !== 401) {
              return res.json();
            } else {
              localStorage.removeItem("access_token");

              signInPopup();
            }
          })
          .then((data) => {
            if (data?.items) {
              setEvents(signInPopup(data.items));
            }
          });
      }
    });
  }, []);

  const formatEvents = (list) => {
    return list.map((item) => ({
      title: item.summary,
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
    }));
  };

  return (
    <div className="App">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  );
}

export default App;
