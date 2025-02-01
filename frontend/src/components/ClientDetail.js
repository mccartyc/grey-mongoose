import React, {useState, useEffect} from 'react';
import axios from 'axios';
import '../styles/styles.css';
import '../styles/clientDetailStyles.css'
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import AuthContext
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles


const ClientDetail = () => {
  const { id } = useParams(); // Get the client ID from the URL
  console.log('Client ID:', id);
  const [client, setClient] = useState({});
  const [sessions, setSessions] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [currentSessionNotes, setCurrentSessionNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false); // State to control editing mode
  const [isLoading, setIsLoading] = useState(true); // Spinner state
  const navigate = useNavigate();

  const { user } = useAuth(); // Access the current user from AuthContext

useEffect(() => {
  const fetchClients = async () => {

    if (!id) {
      console.error('User is not logged in or data is missing.');
      return;
    }
    try {

      setIsLoading(true);

      console.log("Fetching sessions with", { id, tenantId: user?.tenantId, userId: user?.userId });


      const sessions = await axios.get(`http://localhost:5001/api/sessions/client/${id}`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
          sortBy: 'date',  // Specify the field you want to sort by
          order: 'desc'    // Specify the sorting order, 'asc' or 'desc'
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      console.log("Client Detail Sessions:", sessions.data);
      setSessions(sessions.data);


      const clientResponse = await axios.get(`http://localhost:5001/api/clients/${id}`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        });
        console.log('clientReesponseTenantId:', user.tenantId);
        console.log('clientReesponseUserId:', user.userId);
        console.log('Fetching data for client:', clientResponse.data);
        setClient(clientResponse.data);
      // setClient(clientResponse.data);
      

      const upcomingResponse = await axios.get(`http://localhost:5001/api/appointments/upcoming/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      setUpcomingAppointments(upcomingResponse.data);
      // setUpcomingAppointments(null);
      // Navigate to a detail view or show session information
    } catch (error) {
      console.error("Error fetching client sessions:", error);
      // Handle the error (e.g., show a notification)
      setIsLoading(false);
    }
  }
fetchClients();
}, [user, id]); // Re-run the effect when the user changes


const handleSelectSession = (session) => {
  setSelectedSessionId(session.sessionId);
};

const filteredSessions = sessions.filter((session) =>
  session.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
  session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
  session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
);


const handleViewNotes = (session) => {
  setCurrentSessionNotes(session.notes); // Set the notes for the selected session
  setSelectedSessionId(session.sessionId); // Set selected session ID
  setIsEditing(false); // Set to not editing initially
  setShowModal(true); // Show the modal
};

const handleEditNotes = () => {
  setIsEditing(true);
};

const handleSaveNotes = async () => {
  try {
    // Archive original notes, you would typically want to do this in your backend
    const originalNotes = { content: sessions.find(s => s.sessionId === selectedSessionId).notes, archived: true };
    // Here you might want to save the original notes in your backend if required
    await axios.post(`http://localhost:5001/api/notes/archive`, originalNotes); // Example endpoint for archiving notes

    // Save updated notes
    const updatedNotes = { notes: currentSessionNotes, sessionId: selectedSessionId };
    await axios.put(`http://localhost:5001/api/sessions/${selectedSessionId}`, updatedNotes); // Update session with new notes

    // Refresh session data

    const response = await axios.get(`http://localhost:5001/api/sessions?tenantId=${user.tenantId}&userId=${user.userId}`);
    setSessions(response.data);
    setShowModal(false); // Close modal after saving
  } catch (error) {
    console.error('Error saving notes:', error);
    setMessage('Failed to save notes.');
  }
};
  
if (isLoading) {
  // Spinner while loading
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
}

return (
  <div className="client-detail-page">
    <div className="top-section">
      <div className="client-details">
        <h3>Client Details</h3>
        <p><strong>Id:</strong> {id}</p>
        <p><strong>First Name:</strong> {client.firstName}</p>
        <p><strong>Last Name:</strong> {client.lastName}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Address:</strong> {client.streetAddress}</p>
        <p><strong>City:</strong> {client.city}</p>
        <p><strong>State:</strong> {client.state}</p>
        <p><strong>Birthday:</strong> {new Date(client.birthday).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
        <p><strong>Gender:</strong> {client.gender}</p>
      </div>

      <div className="upcoming-appointments">
        <h3>Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <ul>
            {upcomingAppointments.map((appointment) => (
              <li key={appointment.id}>
                {new Date(appointment.date).toLocaleString()} - {appointment.type}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming appointments.</p>
        )}
      </div>
    </div>

    

    <div className="sessions-section">
    <h3>Session Details</h3>
      <div className="header-container">
        <button onClick={() => navigate(`/clients/${id}/new-session`)} className="btn create-btn">New Session</button>
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {message && <p className="error-message">{message}</p>}

      <table className="session-table">
        <thead>
          <tr>
            <th>Date</th>
            {/* <th>Client Name</th> */}
            <th>Type</th>
            <th>Length</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.map((session) => (
            <tr
              key={session.sessionId}
              className={selectedSessionId === session.sessionId ? 'selected' : ''}
              onClick={() => handleSelectSession(session)}
            >
              <td>{new Date(session.date).toLocaleDateString()}</td>
              {/* <td>{session.clientId}</td> */}
              <td>{session.type}</td>
              <td>{session.length}</td>
              <td><button onClick={() => handleViewNotes(session)}>View Notes</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Session Notes</h2>
              <button onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              {isEditing ? (
                <ReactQuill
                  value={currentSessionNotes}
                  onChange={setCurrentSessionNotes}
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: currentSessionNotes }} />
              )}
            </div>
            <div className="modal-footer">
              {isEditing ? (
                <button onClick={handleSaveNotes}>Save Changes</button>
              ) : (
                <button onClick={handleEditNotes}>Edit</button>
              )}
              <button onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ClientDetail;