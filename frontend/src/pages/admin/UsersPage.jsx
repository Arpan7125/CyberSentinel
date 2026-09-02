import React, { useState, useEffect } from 'react';
import { adminService, authService } from '../../services/api';
import { Search, KeyRound, X, Eye } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', role: '', is_active: true });

  // Contact details arrive masked. This holds the ones an admin has explicitly
  // asked to see, keyed by user id — never persisted, gone on reload.
  const [revealed, setRevealed] = useState({});
  const [revealing, setRevealing] = useState(null);

  // Search runs server-side. It has to: the browser only ever receives the
  // masked address, so filtering locally could not match a full one.
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async (query = '') => {
    try {
      const res = await adminService.getUsers(query);
      setUsers(Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => setSearch(e.target.value);

  /**
   * Ask the server for one user's real contact details.
   *
   * This writes an audit record naming the administrator, so it is offered per
   * row and never called to fill the table.
   */
  const handleReveal = async (u) => {
    setRevealing(u.id);
    try {
      const res = await adminService.revealContact(u.id, 'Viewed in user directory');
      setRevealed(prev => ({ ...prev, [u.id]: { email: res.email, phone: res.phone } }));
    } catch (err) {
      console.error('Failed to reveal contact details:', err);
      alert(err.message || 'Could not reveal those details.');
    } finally {
      setRevealing(null);
    }
  };

  const handleEditClick = (u) => {
    setSelectedUser(u);
    setEditForm({ 
      first_name: u.first_name || '', 
      last_name: u.last_name || '', 
      role: u.role || 'customer', 
      is_active: u.is_active !== false 
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateUser(selectedUser.id, editForm);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert('User updated successfully.');
    } catch (err) {
      console.error("Failed to update user:", err);
      alert('Failed to update user.');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await adminService.userAction({ action: 'toggle_active', user_id: id });
      fetchUsers();
    } catch (err) {
      console.error("Failed to suspend user:", err);
      alert('Failed to suspend/activate user.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.userAction({ action: 'delete', user_id: id });
        fetchUsers();
      } catch (err) {
        console.error("Failed to delete user:", err);
        alert(err.data?.error || 'Failed to delete user.');
      }
    }
  };

  /**
   * Triggers the same reset flow the user would start themselves: the server
   * emails them a one-time code. This button previously only announced that the
   * feature "will be integrated", so an admin who clicked it believed they had
   * helped a locked-out user when nothing had been sent.
   *
   * The admin never sees or sets the password — the code goes to the account's
   * own address, which is what keeps this from being an account-takeover tool.
   */
  const handleResetPassword = async (u) => {
    if (!window.confirm(`Email a password reset code to ${u.username}?`)) return;

    try {
      // The table only holds the masked address, and mailing a reset to
      // "arp•••@example.com" would silently go nowhere. Resolve the real
      // one through the audited reveal endpoint, so sending a reset is recorded
      // the same way reading the address is.
      const known = revealed[u.id];
      const email = known?.email
        || (await adminService.revealContact(u.id, 'Sending password reset')).email;

      if (!email) {
        alert('This account has no email address on file, so a reset cannot be sent.');
        return;
      }

      await authService.forgotPassword(email);
      alert(`A reset code has been emailed to ${email}.`);
    } catch (err) {
      alert(err.data?.error || err.message || 'Could not send the reset email.');
    }
  };

  // The server already applied `search`; re-filtering here would only discard
  // rows it matched on a full email address the browser cannot see.
  const filteredUsers = users;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">User Directory</h1>
        <p className="page-subtitle">
          Inspect enrolled portal user accounts, roles, and access permissions. Contact details are
          masked; revealing one is recorded in the audit log against your account.
        </p>
      </div>

      {/* Directory Filters Search */}
      <div className="glass-card" style={{ padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="form-input-pub"
          placeholder="Search by name, username, or full email address..."
          value={search}
          onChange={handleSearch}
          style={{ flex: 1, border: 'none', background: 'transparent', padding: 0 }}
        />
      </div>

      {/* Users table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div className="data-table-wrap">
          {loading ? (
             <p>Loading users...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                      No users found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 650 }}>{u.first_name} {u.last_name}</td>
                      <td>{u.username}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {revealed[u.id] ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{revealed[u.id].email}</span>
                            {revealed[u.id].phone && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {revealed[u.id].phone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {u.email}
                            <button
                              type="button"
                              className="btn-pub btn-pub-ghost btn-pub-sm"
                              onClick={() => handleReveal(u)}
                              disabled={revealing === u.id}
                              title="Show the real contact details. This is recorded in the audit log."
                              style={{ padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={13} /> {revealing === u.id ? '…' : 'Reveal'}
                            </button>
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-critical' : u.role === 'enterprise' ? 'badge-admin' : 'badge-low'}`} style={{ padding: '3px 8px' }}>
                          {u.role || 'customer'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.is_active !== false ? 'status-active' : 'status-danger'}`}>
                          <span className="status-badge-dot" /> {u.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => handleEditClick(u)}>
                            Edit
                          </button>
                          <button
                            className="btn-pub btn-pub-secondary btn-pub-sm"
                            style={{ color: u.is_active !== false ? '#FF9500' : 'var(--accent-green)' }}
                            onClick={() => handleSuspend(u.id)}
                          >
                            {u.is_active !== false ? 'Suspend' : 'Activate'}
                          </button>
                          <button className="btn-pub btn-pub-ghost btn-pub-sm" onClick={() => handleResetPassword(u)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <KeyRound size={14} /> Reset pwd
                          </button>
                          <button className="btn-pub btn-pub-ghost btn-pub-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(u.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit User Modal Dialog */}
      {showEditModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Edit User: {selectedUser.username}</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label-pub">First Name</label>
                    <input
                      type="text"
                      className="form-input-pub"
                      value={editForm.first_name}
                      onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label-pub">Last Name</label>
                    <input
                      type="text"
                      className="form-input-pub"
                      value={editForm.last_name}
                      onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label-pub">User Role</label>
                  <select
                    className="form-select-pub"
                    value={editForm.role}
                    onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                  >
                    <option value="customer">Customer</option>
                    <option value="enterprise">Enterprise Customer</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label-pub">Account Status</label>
                  <select
                    className="form-select-pub"
                    value={editForm.is_active ? 'Active' : 'Suspended'}
                    onChange={e => setEditForm(p => ({ ...p, is_active: e.target.value === 'Active' }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="submit" className="btn-pub btn-pub-primary btn-pub-sm">Save Changes</button>
                  <button type="button" className="btn-pub btn-pub-secondary btn-pub-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
