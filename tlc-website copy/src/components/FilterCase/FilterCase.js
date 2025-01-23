import React, { useState } from "react";
import "./FilterCase.css";

const FilterCase = ({cases=[], fCases}) => {
    const [filters, setFilters] = useState({
        name: "",
        status: "",
        resolution: "",
        startDate: "",
        endDate: "",
    });
    const [timeLapseCases] = useState(cases);

    // Handle Filtering
    const handleFilterChange = (filterType, value) => {
        const updatedFilters = { ...filters, [filterType]: value };
        setFilters(updatedFilters);
    
        const filtered = timeLapseCases.filter((caseItem) => {
            const matchesName = updatedFilters.name
                ? caseItem.name.toLowerCase().includes(updatedFilters.name.toLowerCase())
                : true;
        
            const matchesStatus = updatedFilters.status
                ? caseItem.status === updatedFilters.status
                : true;
        
            const matchesResolution = updatedFilters.resolution
                ? caseItem.resolution === updatedFilters.resolution
                : true;

            const caseStartDate = new Date(caseItem.caseStart);
            const caseEndDate = new Date(caseItem.caseEnd);

            const matchesDateRange =
            (!updatedFilters.startDate || caseStartDate >= new Date(updatedFilters.startDate)) &&
            (!updatedFilters.endDate || caseEndDate <= new Date(updatedFilters.endDate));      
    
          return matchesName && matchesStatus && matchesResolution && matchesDateRange;
        });
        fCases(filtered);
    };
    
    return(
        <div className="filter-container">
            <div className="filter-item">
                <label htmlFor="filter-name">Name:</label>
                <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                />
            </div>

            <div className="filter-item">
                <label htmlFor="filter-status">Status:</label>
                <select
                    value={filters.status || ""}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                    <option value="">All</option>
                    <option value="running">Running</option>
                    <option value="standby">Standby</option>
                    <option value="completed">Completed</option>
                    <option value="aborted">Aborted</option>
                </select>
            </div>
            
            <div className="filter-item">
                <label htmlFor="filter-resolution">Resolution:</label>
                    <select
                        value={filters.resolution || ""}
                        onChange={(e) => handleFilterChange("resolution", e.target.value)}
                    >
                    <option value="">All</option>
                    <option value="Max_View">12MP (4056x3040)</option>
                    <option value="4K_UHD">4K UHD (3840x2160)</option>
                    <option value="2K_UHD">2K UHD (2560x1440)</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720)</option>
                    <option value="SD_480p">480p SD (640x480)</option>
                </select>
            </div>

            <div className="filter-item">
                <label htmlFor="filter-start">Start:</label>
                    <input
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    />
            </div>

            <div className="filter-item">
                <label htmlFor="filter-end">End:</label>
                    <input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
            </div>
        </div>
    );
}

export default FilterCase;