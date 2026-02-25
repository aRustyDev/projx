/**
 * Epics Page Server Load
 * @module routes/(app)/epics/+page.server
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

		return {
			issues,
			statuses,
			assignees
		};
	} catch (error) {
		console.error('Failed to load epics:', error);
		return {
			issues: [],
			statuses: ['open', 'in_progress', 'done'],
			assignees: [],
			error: error instanceof Error ? error.message : 'Failed to load epics'
		};
	}
};
