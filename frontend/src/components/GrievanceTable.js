import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const GrievanceTable = ({ grievances }) => {
    const navigate = useNavigate();

    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'title', headerName: 'Title', flex: 1, minWidth: 250 },
        {
            field: 'submitted_by',
            headerName: 'Submitted By',
            width: 200,
            // UPDATED valueGetter with a more robust safety check
            valueGetter: (params) => {
                // First check if the row itself exists, then check for submitted_by
                return params.row && params.row.submitted_by ? params.row.submitted_by.name : 'N/A';
            }
        },
        { field: 'status', headerName: 'Status', width: 150 },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 180,
            valueGetter: (params) => params.row ? new Date(params.row.created_at).toLocaleString() : 'N/A'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            width: 150,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/admin/grievance/${params.id}`)}
                >
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={grievances}
                columns={columns}
                initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 20]}
                checkboxSelection
                disableRowSelectionOnClick
            />
        </div>
    );
};

export default GrievanceTable;