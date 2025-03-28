import { isNull } from '@sniptt/guards';
import { useRecoilCallback, useRecoilState, useSetRecoilState } from 'recoil';
import { v4 } from 'uuid';

import { useUpsertActivity } from '@/activities/hooks/useUpsertActivity';
import { ActivityTargetInlineCellEditModeMultiRecordsEffect } from '@/activities/inline-cell/components/ActivityTargetInlineCellEditModeMultiRecordsEffect';
import { ActivityTargetInlineCellEditModeMultiRecordsSearchFilterEffect } from '@/activities/inline-cell/components/ActivityTargetInlineCellEditModeMultiRecordsSearchFilterEffect';
import { ActivityTargetObjectRecordEffect } from '@/activities/inline-cell/components/ActivityTargetObjectRecordEffect';
import { MultipleObjectRecordOnClickOutsideEffect } from '@/activities/inline-cell/components/MultipleObjectRecordOnClickOutsideEffect';
import { isActivityInCreateModeState } from '@/activities/states/isActivityInCreateModeState';
import { ActivityTargetWithTargetRecord } from '@/activities/types/ActivityTargetObject';
import { Note } from '@/activities/types/Note';
import { NoteTarget } from '@/activities/types/NoteTarget';
import { Task } from '@/activities/types/Task';
import { TaskTarget } from '@/activities/types/TaskTarget';
import { getActivityTargetObjectFieldIdName } from '@/activities/utils/getActivityTargetObjectFieldIdName';
import { getJoinObjectNameSingular } from '@/activities/utils/getJoinObjectNameSingular';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { useCreateManyRecordsInCache } from '@/object-record/cache/hooks/useCreateManyRecordsInCache';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { activityTargetObjectRecordFamilyState } from '@/object-record/record-field/states/activityTargetObjectRecordFamilyState';
import { objectRecordMultiSelectCheckedRecordsIdsComponentState } from '@/object-record/record-field/states/objectRecordMultiSelectCheckedRecordsIdsComponentState';
import {
  ObjectRecordAndSelected,
  objectRecordMultiSelectComponentFamilyState,
} from '@/object-record/record-field/states/objectRecordMultiSelectComponentFamilyState';
import { useInlineCell } from '@/object-record/record-inline-cell/hooks/useInlineCell';
import { MultipleRecordPicker } from '@/object-record/record-picker/components/MultipleRecordPicker';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { prefillRecord } from '@/object-record/utils/prefillRecord';
import { useRef } from 'react';

type ActivityTargetInlineCellEditModeProps = {
  activity: Task | Note;
  activityTargetWithTargetRecords: ActivityTargetWithTargetRecord[];
  activityObjectNameSingular:
    | CoreObjectNameSingular.Note
    | CoreObjectNameSingular.Task;
};

export const ActivityTargetInlineCellEditMode = ({
  activity,
  activityTargetWithTargetRecords,
  activityObjectNameSingular,
}: ActivityTargetInlineCellEditModeProps) => {
  const [isActivityInCreateMode] = useRecoilState(isActivityInCreateModeState);
  const recordPickerInstanceId = `record-picker-${activity.id}`;

  const selectedTargetObjectIds = activityTargetWithTargetRecords.map(
    (activityTarget) => ({
      objectNameSingular: activityTarget.targetObjectMetadataItem.nameSingular,
      id: activityTarget.targetObject.id,
    }),
  );

  const { createOneRecord: createOneActivityTarget } = useCreateOneRecord<
    NoteTarget | TaskTarget
  >({
    objectNameSingular: getJoinObjectNameSingular(activityObjectNameSingular),
  });

  const { deleteOneRecord: deleteOneActivityTarget } = useDeleteOneRecord({
    objectNameSingular: getJoinObjectNameSingular(activityObjectNameSingular),
  });

  const { closeInlineCell: closeEditableField } = useInlineCell();

  const { upsertActivity } = useUpsertActivity({
    activityObjectNameSingular,
  });

  const { objectMetadataItem: objectMetadataItemActivityTarget } =
    useObjectMetadataItem({
      objectNameSingular: getJoinObjectNameSingular(activityObjectNameSingular),
    });

  const setActivityFromStore = useSetRecoilState(
    recordStoreFamilyState(activity.id),
  );

  const { createManyRecordsInCache: createManyActivityTargetsInCache } =
    useCreateManyRecordsInCache<NoteTarget | TaskTarget>({
      objectNameSingular: getJoinObjectNameSingular(activityObjectNameSingular),
    });

  const handleSubmit = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const activityTargetsAfterUpdate =
          activityTargetWithTargetRecords.filter((activityTarget) => {
            const recordSelectedInMultiSelect = snapshot
              .getLoadable(
                objectRecordMultiSelectComponentFamilyState({
                  scopeId: recordPickerInstanceId,
                  familyKey: activityTarget.targetObject.id,
                }),
              )
              .getValue() as ObjectRecordAndSelected;

            return recordSelectedInMultiSelect
              ? recordSelectedInMultiSelect.selected
              : true;
          });
        setActivityFromStore((currentActivity) => {
          if (isNull(currentActivity)) {
            return null;
          }

          return {
            ...currentActivity,
            activityTargets: activityTargetsAfterUpdate,
          };
        });
        closeEditableField();
      },
    [
      activityTargetWithTargetRecords,
      closeEditableField,
      recordPickerInstanceId,
      setActivityFromStore,
    ],
  );

  const handleChange = useRecoilCallback(
    ({ snapshot, set }) =>
      async (recordId: string) => {
        const existingActivityTargets = activityTargetWithTargetRecords.map(
          (activityTargetObjectRecord) =>
            activityTargetObjectRecord.activityTarget,
        );

        let activityTargetsAfterUpdate = Array.from(existingActivityTargets);

        const previouslyCheckedRecordsIds = snapshot
          .getLoadable(
            objectRecordMultiSelectCheckedRecordsIdsComponentState({
              scopeId: recordPickerInstanceId,
            }),
          )
          .getValue();

        const isNewlySelected = !previouslyCheckedRecordsIds.includes(recordId);

        if (isNewlySelected) {
          const record = snapshot
            .getLoadable(
              objectRecordMultiSelectComponentFamilyState({
                scopeId: recordPickerInstanceId,
                familyKey: recordId,
              }),
            )
            .getValue();

          if (!record) {
            throw new Error(
              `Could not find selected record with id ${recordId}`,
            );
          }

          set(
            objectRecordMultiSelectCheckedRecordsIdsComponentState({
              scopeId: recordPickerInstanceId,
            }),
            (prev) => [...prev, recordId],
          );

          const newActivityTargetId = v4();
          const fieldNameWithIdSuffix = getActivityTargetObjectFieldIdName({
            nameSingular: record.objectMetadataItem.nameSingular,
          });

          const newActivityTargetInput = {
            id: newActivityTargetId,
            ...(activityObjectNameSingular === CoreObjectNameSingular.Task
              ? { taskId: activity.id }
              : { noteId: activity.id }),
            [fieldNameWithIdSuffix]: recordId,
          };

          const newActivityTarget = prefillRecord<NoteTarget | TaskTarget>({
            objectMetadataItem: objectMetadataItemActivityTarget,
            input: newActivityTargetInput,
          });

          activityTargetsAfterUpdate.push(newActivityTarget);

          if (isActivityInCreateMode) {
            createManyActivityTargetsInCache([newActivityTarget]);
            upsertActivity({
              activity,
              input: {
                [activityObjectNameSingular === CoreObjectNameSingular.Task
                  ? 'taskTargets'
                  : activityObjectNameSingular === CoreObjectNameSingular.Note
                    ? 'noteTargets'
                    : '']: activityTargetsAfterUpdate,
              },
            });
          } else {
            await createOneActivityTarget(newActivityTargetInput);
          }

          set(activityTargetObjectRecordFamilyState(recordId), {
            activityTargetId: newActivityTargetId,
          });
        } else {
          const activityTargetToDeleteId = snapshot
            .getLoadable(activityTargetObjectRecordFamilyState(recordId))
            .getValue().activityTargetId;

          if (!activityTargetToDeleteId) {
            throw new Error('Could not delete this activity target.');
          }

          set(
            objectRecordMultiSelectCheckedRecordsIdsComponentState({
              scopeId: recordPickerInstanceId,
            }),
            previouslyCheckedRecordsIds.filter((id) => id !== recordId),
          );
          activityTargetsAfterUpdate = activityTargetsAfterUpdate.filter(
            (activityTarget) => activityTarget.id !== activityTargetToDeleteId,
          );

          if (isActivityInCreateMode) {
            upsertActivity({
              activity,
              input: {
                [activityObjectNameSingular === CoreObjectNameSingular.Task
                  ? 'taskTargets'
                  : activityObjectNameSingular === CoreObjectNameSingular.Note
                    ? 'noteTargets'
                    : '']: activityTargetsAfterUpdate,
              },
            });
          } else {
            await deleteOneActivityTarget(activityTargetToDeleteId);
          }

          set(activityTargetObjectRecordFamilyState(recordId), {
            activityTargetId: null,
          });
        }
      },
    [
      activity,
      activityTargetWithTargetRecords,
      createOneActivityTarget,
      createManyActivityTargetsInCache,
      deleteOneActivityTarget,
      isActivityInCreateMode,
      objectMetadataItemActivityTarget,
      recordPickerInstanceId,
      upsertActivity,
      activityObjectNameSingular,
    ],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ActivityTargetObjectRecordEffect
        activityTargetWithTargetRecords={activityTargetWithTargetRecords}
      />
      <ActivityTargetInlineCellEditModeMultiRecordsEffect
        recordPickerInstanceId={recordPickerInstanceId}
        selectedObjectRecordIds={selectedTargetObjectIds}
      />
      <ActivityTargetInlineCellEditModeMultiRecordsSearchFilterEffect
        recordPickerInstanceId={recordPickerInstanceId}
      />
      <MultipleObjectRecordOnClickOutsideEffect
        containerRef={containerRef}
        onClickOutside={closeEditableField}
      />
      <div ref={containerRef}>
        <MultipleRecordPicker
          onSubmit={handleSubmit}
          onChange={handleChange}
          componentInstanceId={recordPickerInstanceId}
        />
      </div>
    </>
  );
};
