import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../api';
import { adminAPI } from '../../services/api';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  const debouncedSearch = useDebounce(search, 300);
  
  // Data
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newCustomersMonth: 0,
    totalAdmins: 0
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const limit = 20;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  }, [debouncedSearch, roleFilter, page, setSearchParams]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch,
        role: roleFilter === 'all' ? undefined : roleFilter
      };
      const res = await adminAPI.getUsers(params);
      setCustomers(res.data.users || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats({
        totalCustomers: res.data.overview?.totalCustomers || 0,
        newCustomersMonth: res.data.overview?.newCustomersMonth || 0,
        totalAdmins: res.data.overview?.totalAdmins || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  // View customer details
  const viewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setDetailsLoading(true);
    try {
      const res = await adminAPI.getUserOrders(customer._id);
      setCustomerDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setSelectedCustomer(null);
    setCustomerDetails(null);
  };

  // Filtered count for display
  const filteredCount = useMemo(() => customers.length, [customers]);

  // Role badge colors
  const getRoleBadge = (role) => {
    const styles = {
      customer: { bg: '#065f46', color: '#34d399', border: '#059669' },
      admin: { bg: '#581c87', color: '#c084fc', border: '#7c3aed' },
      superadmin: { bg: '#92400e', color: '#fcd34d', border: '#d97706' }
    };
    const style = styles[role] || styles.customer;
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {role}
      </span>
    );
  };

  // Auth provider badge
  const getAuthBadge = (provider) => {
    const isGoogle = provider === 'google';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.75rem',
        color: isGoogle ? '#60a5fa' : 'var(--rd-muted)'
      }}>
        <i className={`fab ${isGoogle ? 'fa-google' : 'fa-envelope'}`} />
        {isGoogle ? 'Google' : 'Email'}
      </span>
    );
  };

  // Status pill
  const getStatusPill = (isActive) => (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      background: isActive ? '#065f46' : '#7f1d1d',
      color: isActive ? '#34d399' : '#fca5a5',
      border: `1px solid ${isActive ? '#059669' : '#dc2626'}`
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'currentColor'
      }} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  // KPI Cards
  const KPICard = ({ title, value, subtitle, icon }) => (
    <div style={{
      background: 'var(--rd-card)',
      border: '1px solid var(--rd-border)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ fontSize: '0.875rem', color: 'var(--rd-muted)', marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
          {value.toLocaleString()}
        </div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--rd-blue-bright)' }}>{subtitle}</div>}
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(59,130,246,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--rd-blue)',
        fontSize: '1.25rem'
      }}>
        <i className={`fas ${icon}`} />
      </div>
    </div>
  );

  return (
    <AdminLayout title="CUSTOMERS">
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <KPICard 
          title="Total Customers" 
          value={stats.totalCustomers} 
          subtitle="All time registered"
          icon="fa-users"
        />
        <KPICard 
          title="New This Month" 
          value={stats.newCustomersMonth} 
          subtitle="New registrations"
          icon="fa-user-plus"
        />
        <KPICard 
          title="Shown" 
          value={filteredCount} 
          subtitle="Current filter results"
          icon="fa-filter"
        />
      </div>

      {/* Filter Bar */}
      <div style={{
        background: 'var(--rd-card)',
        border: '1px solid var(--rd-border)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <i className="fas fa-search" style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--rd-muted)',
            fontSize: '0.875rem'
          }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: 'var(--rd-input)',
              border: '1px solid var(--rd-border)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'customer', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: roleFilter === role ? 'var(--rd-blue)' : 'var(--rd-border)',
                background: roleFilter === role ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: roleFilter === role ? 'var(--rd-blue)' : 'var(--rd-muted)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {role === 'all' ? 'All Users' : role + 's'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchCustomers}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--rd-border)',
            background: 'transparent',
            color: 'var(--rd-muted)',
            cursor: 'pointer'
          }}
          title="Refresh"
        >
          <i className="fas fa-sync-alt" />
        </button>
      </div>

      {/* Customer Table */}
      <div style={{
        background: 'var(--rd-card)',
        border: '1px solid var(--rd-border)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auth</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--rd-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--rd-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--rd-muted)' }}>
                    <i className="fas fa-users-slash" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} style={{ borderTop: '1px solid var(--rd-border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: customer.avatar ? `url(${customer.avatar}) center/cover` : 'var(--rd-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {!customer.avatar && customer.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>{customer.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)' }}>ID: {customer._id.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', color: 'white' }}>{customer.email}</div>
                      {customer.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)', marginTop: '0.25rem' }}>
                          <i className="fas fa-phone" style={{ marginRight: '0.375rem' }} />
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getRoleBadge(customer.role)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getAuthBadge(customer.authProvider)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--rd-muted)' }}>
                      {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getStatusPill(customer.isActive !== false)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <button
                        onClick={() => viewCustomer(customer)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: '1px solid var(--rd-blue)',
                          background: 'transparent',
                          color: 'var(--rd-blue)',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && customers.length > 0 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--rd-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--rd-muted)' }}>
              Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} results
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--rd-border)',
                  background: 'transparent',
                  color: page === 1 ? 'var(--rd-muted)' : 'white',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Previous
              </button>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                background: 'var(--rd-blue)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--rd-border)',
                  background: 'transparent',
                  color: page >= pagination.pages ? 'var(--rd-muted)' : 'white',
                  cursor: page >= pagination.pages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              background: 'var(--rd-card)',
              border: '1px solid var(--rd-border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {detailsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--rd-muted)' }}>Loading customer details...</p>
              </div>
            ) : customerDetails ? (
              <>
                {/* Modal Header */}
                <div style={{
                  padding: '1.5rem 2rem',
                  borderBottom: '1px solid var(--rd-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: customerDetails.user.avatar ? `url(${customerDetails.user.avatar}) center/cover` : 'var(--rd-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'white'
                    }}>
                      {!customerDetails.user.avatar && customerDetails.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                        {customerDetails.user.name}
                      </h2>
                      <div style={{ marginTop: '0.5rem' }}>
                        {getRoleBadge(customerDetails.user.role)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--rd-muted)',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      padding: '0.5rem'
                    }}
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '2rem' }}>
                  {/* Stats Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--rd-border)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--rd-muted)', marginBottom: '0.5rem' }}>Total Orders</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                        {customerDetails.stats.totalOrders}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--rd-border)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--rd-muted)', marginBottom: '0.5rem' }}>Total Spent</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rd-green)' }}>
                        ${customerDetails.stats.totalSpent.toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(15,23,42,0.5)',
                      border: '1px solid var(--rd-border)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--rd-muted)', marginBottom: '0.5rem' }}>Avg Order Value</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--rd-blue)' }}>
                        ${customerDetails.stats.avgOrderValue.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Account Information
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      background: 'rgba(15,23,42,0.3)',
                      border: '1px solid var(--rd-border)',
                      borderRadius: '12px',
                      padding: '1.5rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                        <div style={{ fontSize: '0.875rem', color: 'white' }}>{customerDetails.user.email}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                        <div style={{ fontSize: '0.875rem', color: 'white' }}>{customerDetails.user.phone || 'Not provided'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Member Since</div>
                        <div style={{ fontSize: '0.875rem', color: 'white' }}>
                          {new Date(customerDetails.user.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Auth Provider</div>
                        <div style={{ fontSize: '0.875rem', color: 'white' }}>
                          {getAuthBadge(customerDetails.user.authProvider)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Order History
                    </h3>
                    {customerDetails.orders.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--rd-muted)',
                        background: 'rgba(15,23,42,0.3)',
                        border: '1px solid var(--rd-border)',
                        borderRadius: '12px'
                      }}>
                        <i className="fas fa-shopping-bag" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }} />
                        No orders yet
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--rd-border)' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase' }}>Order #</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase' }}>Date</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase' }}>Status</th>
                              <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--rd-muted)', textTransform: 'uppercase' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.orders.map((order) => (
                              <tr key={order._id} style={{ borderBottom: '1px solid var(--rd-border2)' }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--rd-blue)', fontWeight: 600 }}>
                                  #{order.orderNumber}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'white' }}>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    textTransform: 'capitalize',
                                    background: order.status === 'delivered' ? '#065f46' : 
                                               order.status === 'cancelled' ? '#7f1d1d' : '#1e40af',
                                    color: order.status === 'delivered' ? '#34d399' : 
                                           order.status === 'cancelled' ? '#fca5a5' : '#93c5fd'
                                  }}>
                                    {order.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'white', textAlign: 'right', fontWeight: 600 }}>
                                  ${order.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}