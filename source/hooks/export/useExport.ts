import { useState } from 'react';
import { usePermitSDK } from './PermitSDK.js';
import { ExportState } from '../../commands/env/export/types.js';
import {
	createWarningCollector,
	generateProviderBlock,
} from '../../commands/env/export/utils.js';
import { ResourceGenerator } from '../../commands/env/export/generators/ResourceGenerator.js';
import { RoleGenerator } from '../../commands/env/export/generators/RoleGenerator.js';
import { UserAttributesGenerator } from '../../commands/env/export/generators/UserAttributesGenerator.js';
import { RelationGenerator } from '../../commands/env/export/generators/RelationGenerator.js';
import { ConditionSetGenerator } from '../../commands/env/export/generators/ConditionSetGenerator.js';
import { ResourceSetGenerator } from '../../commands/env/export/generators/ResourceSetGenerator.js';
import { UserSetGenerator } from '../../commands/env/export/generators/UserSetGenerator.js';
import { RoleDerivationGenerator } from '../../commands/env/export/generators/RoleDerivationGenerator.js';

// Define a type for the `scope` parameter
interface ExportScope {
	environment_id?: string;
	project_id?: string;
	organization_id?: string;
}

export const useExport = (apiKey: string) => {
	const [state, setState] = useState<ExportState>({
		status: '',
		isComplete: false,
		error: null,
		warnings: [],
	});

	const permit = usePermitSDK(apiKey);

	const exportConfig = async (scope: ExportScope) => {
		try {
			const warningCollector = createWarningCollector();

			let hcl = `# Generated by Permit CLI
# Environment: ${scope?.environment_id || 'unknown'}
# Project: ${scope?.project_id || 'unknown'}
# Organization: ${scope?.organization_id || 'unknown'}
${generateProviderBlock(apiKey)}`;

			const generators = [
				new ResourceGenerator(permit, warningCollector),
				new RoleGenerator(permit, warningCollector),
				new UserAttributesGenerator(permit, warningCollector),
				new RelationGenerator(permit, warningCollector),
				new ConditionSetGenerator(permit, warningCollector),
				new ResourceSetGenerator(permit, warningCollector),
				new UserSetGenerator(permit, warningCollector),
				new RoleDerivationGenerator(permit, warningCollector),
			];

			for (const generator of generators) {
				setState(prev => ({
					...prev,
					status: `Exporting ${generator.name}...`,
				}));

				const generatedHCL = await generator.generateHCL();
				if (generatedHCL) {
					hcl += generatedHCL;
				}
			}

			return { hcl, warnings: warningCollector.getWarnings() };
		} catch (error) {
			console.error('Export error:', error);
			throw error;
		}
	};

	return {
		state,
		setState,
		exportConfig,
	};
};
