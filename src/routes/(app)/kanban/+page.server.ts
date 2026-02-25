/**
 * Kanban Board Page Server Load
 * @module routes/(app)/kanban/+page.server
 *
 * Loads issues from the database on the server side.
 */

import { DataAccessLayer } from '$lib/server/db/dal.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		const dal = await DataAccessLayer.create();
		const issues = await dal.getIssues();

		// Extract unique values for filters
		const statuses = [...new Set(issues.map((i) => i.status).filter(Boolean))];
		const assignees = [...new Set(issues.map((i) => i.assignee).filter(Boolean))] as string[];
		const issueTypes = [...new Set(issues.map((i) => i.issue_type).filter(Boolean))];

		return {
			issues,
			statuses,
			assignees,
			issueTypes
		};
	} catch (error) {
		console.error('Failed to load kanban issues:', error);
		return {
			issues: [],
			statuses: ['open', 'in_progress', 'review', 'done'],
			assignees: [],
			issueTypes: ['task', 'bug', 'feature'],
			error: error instanceof Error ? error.message : 'Failed to load issues'
		};
	}
};
