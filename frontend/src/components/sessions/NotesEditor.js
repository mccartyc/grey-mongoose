import React from 'react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const NotesEditor = ({ notes, onNotesChange }) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className="form-row">
      <label className="notes-label new-session-label">
        Notes:
        <ReactQuill
          value={notes}
          onChange={onNotesChange}
          modules={modules}
          placeholder="Enter session notes here..."
        />
      </label>
    </div>
  );
};

NotesEditor.propTypes = {
  notes: PropTypes.string.isRequired,
  onNotesChange: PropTypes.func.isRequired,
};

export default NotesEditor;
