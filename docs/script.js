document.addEventListener('DOMContentLoaded', () => {
    const projectList = document.getElementById('project-list');
    const searchInput = document.getElementById('search-input');
    const tagFilter = document.getElementById('tag-filter');
    const reasonFilter = document.getElementById('reason-filter');
    const totalProjectsSpan = document.getElementById('total-projects');
    const mostCommonReasonSpan = document.getElementById('most-common-reason');
    const tagCloudDiv = document.getElementById('tag-cloud');

    let projects = [];
    let allTags = new Set();
    let allReasons = new Set();

    const renderProjects = (filteredProjects) => {
        projectList.innerHTML = '';
        if (filteredProjects.length === 0) {
            projectList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No projects found matching your criteria.</p>';
            return;
        }

        filteredProjects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';

            const tagsHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            const reasonsHTML = project.reasons_for_failure.map(reason => `<span class="reason">${reason}</span>`).join('');

            const attemptsHTML = project.attempts.map(attempt => {
                let linksHTML = '';
                if (attempt.links) {
                    const links = Object.entries(attempt.links).map(([key, url]) => 
                        `<a href="${url}" target="_blank">${key}</a>`
                    ).join(', ');
                    if (links) {
                        linksHTML = `<p><strong>Links:</strong> ${links}</p>`;
                    }
                }
                return `
                    <div class="attempt">
                        <p><strong>Year:</strong> ${attempt.year || 'N/A'}</p>
                        <p>${attempt.description || 'No description provided.'}</p>
                        ${linksHTML}
                    </div>
                `;
            }).join('');

            projectCard.innerHTML = `
                <h2>${project.title}</h2>
                <p>${project.description}</p>
                <div class="tags">${tagsHTML}</div>
                <div class="tags">${reasonsHTML}</div>
                <div class="attempts-details">
                    <h3>Attempts (${project.attempts_count}):</h3>
                    ${attemptsHTML}
                </div>
            `;
            projectList.appendChild(projectCard);
        });
    };

    const populateFilters = () => {
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
        allReasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason;
            option.textContent = reason;
            reasonFilter.appendChild(option);
        });
    };

    const calculateMetadata = () => {
        const reasonCounts = {};
        projects.forEach(project => {
            project.reasons_for_failure.forEach(reason => {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            });
        });

        let mostCommonReason = 'N/A';
        let maxCount = 0;
        for (const reason in reasonCounts) {
            if (reasonCounts[reason] > maxCount) {
                maxCount = reasonCounts[reason];
                mostCommonReason = reason;
            }
        }
        mostCommonReasonSpan.textContent = mostCommonReason;

        // For now, the tag cloud is not implemented in the new design.
        if (tagCloudDiv) {
            tagCloudDiv.innerHTML = '';
        }
    };

    const filterAndRenderProjects = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedTag = tagFilter.value;
        const selectedReason = reasonFilter.value;

        let filtered = projects.filter(project => {
            const matchesSearch = (
                project.title.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm)
            );
            const matchesTag = selectedTag ? project.tags.includes(selectedTag) : true;
            const matchesReason = selectedReason ? project.reasons_for_failure.includes(selectedReason) : true;

            return matchesSearch && matchesTag && matchesReason;
        });
        
        renderProjects(filtered);
    };

    fetch('../data/registry.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            projects = data;
            totalProjectsSpan.textContent = projects.length;

            projects.forEach(project => {
                project.tags.forEach(tag => allTags.add(tag));
                project.reasons_for_failure.forEach(reason => allReasons.add(reason));
            });

            populateFilters();
            calculateMetadata();
            renderProjects(projects);
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            projectList.innerHTML = '<p style="text-align: center; color: red;">Failed to load projects. See console for details.</p>';
        });

    searchInput.addEventListener('input', filterAndRenderProjects);
    tagFilter.addEventListener('change', filterAndRenderProjects);
    reasonFilter.addEventListener('change', filterAndRenderProjects);
});