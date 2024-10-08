import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useCreateNewWorkflowVersion } from '@/workflow/hooks/useCreateNewWorkflowVersion';
import {
  WorkflowTrigger,
  WorkflowVersion,
  WorkflowWithCurrentVersion,
} from '@/workflow/types/Workflow';
import { isDefined } from 'twenty-ui';

export const useUpdateWorkflowVersionTrigger = ({
  workflow,
}: {
  workflow: WorkflowWithCurrentVersion;
}) => {
  const { updateOneRecord: updateOneWorkflowVersion } =
    useUpdateOneRecord<WorkflowVersion>({
      objectNameSingular: CoreObjectNameSingular.WorkflowVersion,
    });

  const { createNewWorkflowVersion } = useCreateNewWorkflowVersion({
    workflowId: workflow.id,
  });

  const updateTrigger = async (updatedTrigger: WorkflowTrigger) => {
    if (!isDefined(workflow.currentVersion)) {
      throw new Error('Can not update an undefined workflow version.');
    }

    if (workflow.currentVersion.status === 'DRAFT') {
      await updateOneWorkflowVersion({
        idToUpdate: workflow.currentVersion.id,
        updateOneRecordInput: {
          trigger: updatedTrigger,
        },
      });

      return;
    }

    await createNewWorkflowVersion({
      name: `v${workflow.versions.length + 1}`,
      status: 'DRAFT',
      trigger: updatedTrigger,
      steps: workflow.currentVersion.steps,
    });
  };

  return {
    updateTrigger,
  };
};
