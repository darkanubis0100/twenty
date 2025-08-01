import { useAuth } from '@/auth/hooks/useAuth';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { GET_ROLES } from '@/settings/roles/graphql/queries/getRolesQuery';
import { useUpdateWorkspaceMemberRole } from '@/settings/roles/hooks/useUpdateWorkspaceMemberRole';
import { SettingsRoleAssignment } from '@/settings/roles/role-assignment/components/SettingsRoleAssignment';
import { SettingsRolePermissions } from '@/settings/roles/role-permissions/components/SettingsRolePermissions';
import { SettingsRoleSettings } from '@/settings/roles/role-settings/components/SettingsRoleSettings';
import { SettingsRoleLabelContainer } from '@/settings/roles/role/components/SettingsRoleLabelContainer';
import { SETTINGS_ROLE_DETAIL_TABS } from '@/settings/roles/role/constants/SettingsRoleDetailTabs';
import { settingsDraftRoleFamilyState } from '@/settings/roles/states/settingsDraftRoleFamilyState';
import { settingsPersistedRoleFamilyState } from '@/settings/roles/states/settingsPersistedRoleFamilyState';
import { settingsRolesIsLoadingState } from '@/settings/roles/states/settingsRolesIsLoadingState';
import { SettingsPath } from '@/types/SettingsPath';
import { SnackBarVariant } from '@/ui/feedback/snack-bar-manager/components/SnackBar';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { TabList } from '@/ui/layout/tab-list/components/TabList';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useRecoilComponentValueV2 } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValueV2';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { getOperationName } from '@apollo/client/utilities';
import { t } from '@lingui/core/macro';
import { useRecoilState, useRecoilValue } from 'recoil';
import { isDefined } from 'twenty-shared/utils';
import { IconLockOpen, IconSettings, IconUserPlus } from 'twenty-ui/display';
import { v4 } from 'uuid';
import {
  FeatureFlagKey,
  Role,
  useCreateOneRoleMutation,
  useUpdateOneRoleMutation,
  useUpsertObjectPermissionsMutation,
  useUpsertSettingPermissionsMutation,
} from '~/generated/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { getDirtyFields } from '~/utils/getDirtyFields';
import { isDeeplyEqual } from '~/utils/isDeeplyEqual';
import { getSettingsPath } from '~/utils/navigation/getSettingsPath';

type SettingsRoleProps = {
  roleId: string;
  isCreateMode: boolean;
};

const ROLE_BASIC_KEYS: Array<keyof Role> = [
  'label',
  'description',
  'icon',
  'canUpdateAllSettings',
  'canReadAllObjectRecords',
  'canUpdateAllObjectRecords',
  'canSoftDeleteAllObjectRecords',
  'canDestroyAllObjectRecords',
];

export const SettingsRole = ({ roleId, isCreateMode }: SettingsRoleProps) => {
  const activeTabId = useRecoilComponentValueV2(
    activeTabIdComponentState,
    SETTINGS_ROLE_DETAIL_TABS.COMPONENT_INSTANCE_ID,
  );

  const isPermissionsV2Enabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_PERMISSIONS_V2_ENABLED,
  );

  const navigateSettings = useNavigateSettings();

  const [createRole] = useCreateOneRoleMutation();
  const [updateRole] = useUpdateOneRoleMutation();
  const [upsertSettingPermissions] = useUpsertSettingPermissionsMutation();
  const [upsertObjectPermissions] = useUpsertObjectPermissionsMutation();

  const { addWorkspaceMembersToRole } = useUpdateWorkspaceMemberRole(roleId);

  const settingsRolesIsLoading = useRecoilValue(settingsRolesIsLoadingState);

  const [settingsDraftRole, setSettingsDraftRole] = useRecoilState(
    settingsDraftRoleFamilyState(roleId),
  );

  const settingsPersistedRole = useRecoilValue(
    settingsPersistedRoleFamilyState(roleId),
  );

  const { loadCurrentUser } = useAuth();

  const { enqueueSnackBar } = useSnackBar();

  if (!isDefined(settingsRolesIsLoading)) {
    return <></>;
  }

  const isRoleEditable = isPermissionsV2Enabled && settingsDraftRole.isEditable;

  const tabs = [
    {
      id: SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.ASSIGNMENT,
      title: t`Assignment`,
      Icon: IconUserPlus,
    },
    {
      id: SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.PERMISSIONS,
      title: t`Permissions`,
      Icon: IconLockOpen,
    },
    {
      id: SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.SETTINGS,
      title: t`Settings`,
      Icon: IconSettings,
    },
  ];

  const isDirty = !isDeeplyEqual(settingsDraftRole, settingsPersistedRole);

  const handleCancel = () => {
    if (isDefined(settingsPersistedRole)) {
      setSettingsDraftRole(settingsPersistedRole);
    }
  };

  const handleSave = async () => {
    const dirtyFields = getDirtyFields(
      settingsDraftRole,
      settingsPersistedRole,
    );

    if (isDefined(dirtyFields.label) && dirtyFields.label === '') {
      enqueueSnackBar(t`Role name cannot be empty`, {
        variant: SnackBarVariant.Error,
      });
      return;
    }

    if (isCreateMode) {
      const roleId = v4();

      createRole({
        variables: {
          createRoleInput: {
            id: roleId,
            label: settingsDraftRole.label,
            description: settingsDraftRole.description,
            icon: settingsDraftRole.icon,
            canUpdateAllSettings: settingsDraftRole.canUpdateAllSettings,
            canReadAllObjectRecords: settingsDraftRole.canReadAllObjectRecords,
            canUpdateAllObjectRecords:
              settingsDraftRole.canUpdateAllObjectRecords,
            canSoftDeleteAllObjectRecords:
              settingsDraftRole.canSoftDeleteAllObjectRecords,
            canDestroyAllObjectRecords:
              settingsDraftRole.canDestroyAllObjectRecords,
          },
        },
        onCompleted: async (data) => {
          if (isDefined(dirtyFields.workspaceMembers)) {
            await addWorkspaceMembersToRole({
              roleId: data.createOneRole.id,
              workspaceMemberIds: settingsDraftRole.workspaceMembers.map(
                (member) => member.id,
              ),
            });
          }

          if (isDefined(dirtyFields.settingPermissions)) {
            await upsertSettingPermissions({
              variables: {
                upsertSettingPermissionsInput: {
                  roleId: data.createOneRole.id,
                  settingPermissionKeys:
                    settingsDraftRole.settingPermissions?.map(
                      (settingPermission) => settingPermission.setting,
                    ) ?? [],
                },
              },
              refetchQueries: [getOperationName(GET_ROLES) ?? ''],
            });
          }

          if (isDefined(dirtyFields.objectPermissions)) {
            await upsertObjectPermissions({
              variables: {
                upsertObjectPermissionsInput: {
                  roleId: data.createOneRole.id,
                  objectPermissions:
                    settingsDraftRole.objectPermissions?.map(
                      (objectPermission) => ({
                        objectMetadataId: objectPermission.objectMetadataId,
                        canReadObjectRecords:
                          objectPermission.canReadObjectRecords,
                        canUpdateObjectRecords:
                          objectPermission.canUpdateObjectRecords,
                        canSoftDeleteObjectRecords:
                          objectPermission.canSoftDeleteObjectRecords,
                        canDestroyObjectRecords:
                          objectPermission.canDestroyObjectRecords,
                      }),
                    ) ?? [],
                },
              },
              refetchQueries: [getOperationName(GET_ROLES) ?? ''],
            });
          }

          navigateSettings(SettingsPath.RoleDetail, {
            roleId: data.createOneRole.id,
          });
        },
      });
    } else {
      if (isDefined(dirtyFields.settingPermissions)) {
        await upsertSettingPermissions({
          variables: {
            upsertSettingPermissionsInput: {
              roleId: roleId,
              settingPermissionKeys:
                settingsDraftRole.settingPermissions?.map(
                  (settingPermission) => settingPermission.setting,
                ) ?? [],
            },
          },
          refetchQueries: [getOperationName(GET_ROLES) ?? ''],
        });
      }

      if (ROLE_BASIC_KEYS.some((key) => key in dirtyFields)) {
        await updateRole({
          variables: {
            updateRoleInput: {
              id: roleId,
              update: {
                label: settingsDraftRole.label,
                description: settingsDraftRole.description,
                icon: settingsDraftRole.icon,
                canUpdateAllSettings: settingsDraftRole.canUpdateAllSettings,
                canReadAllObjectRecords:
                  settingsDraftRole.canReadAllObjectRecords,
                canUpdateAllObjectRecords:
                  settingsDraftRole.canUpdateAllObjectRecords,
                canSoftDeleteAllObjectRecords:
                  settingsDraftRole.canSoftDeleteAllObjectRecords,
                canDestroyAllObjectRecords:
                  settingsDraftRole.canDestroyAllObjectRecords,
              },
            },
          },
        });
      }

      if (isDefined(dirtyFields.objectPermissions)) {
        await upsertObjectPermissions({
          variables: {
            upsertObjectPermissionsInput: {
              roleId: roleId,
              objectPermissions:
                settingsDraftRole.objectPermissions?.map(
                  (objectPermission) => ({
                    objectMetadataId: objectPermission.objectMetadataId,
                    canReadObjectRecords: objectPermission.canReadObjectRecords,
                    canUpdateObjectRecords:
                      objectPermission.canUpdateObjectRecords,
                    canSoftDeleteObjectRecords:
                      objectPermission.canSoftDeleteObjectRecords,
                    canDestroyObjectRecords:
                      objectPermission.canDestroyObjectRecords,
                  }),
                ) ?? [],
            },
          },
          refetchQueries: [getOperationName(GET_ROLES) ?? ''],
        });
      }
    }

    await loadCurrentUser();
  };

  return (
    <SubMenuTopBarContainer
      title={<SettingsRoleLabelContainer roleId={roleId} />}
      links={[
        {
          children: 'Workspace',
          href: getSettingsPath(SettingsPath.Workspace),
        },
        {
          children: 'Roles',
          href: getSettingsPath(SettingsPath.Roles),
        },
        {
          children: settingsDraftRole.label,
        },
      ]}
      actionButton={
        isRoleEditable &&
        isDirty && (
          <SaveAndCancelButtons onSave={handleSave} onCancel={handleCancel} />
        )
      }
    >
      <SettingsPageContainer>
        <TabList
          tabs={tabs}
          className="tab-list"
          componentInstanceId={SETTINGS_ROLE_DETAIL_TABS.COMPONENT_INSTANCE_ID}
        />
        {activeTabId === SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.ASSIGNMENT && (
          <SettingsRoleAssignment roleId={roleId} isCreateMode={isCreateMode} />
        )}
        {activeTabId === SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.PERMISSIONS && (
          <SettingsRolePermissions
            roleId={roleId}
            isEditable={isRoleEditable}
            isCreateMode={isCreateMode}
          />
        )}
        {activeTabId === SETTINGS_ROLE_DETAIL_TABS.TABS_IDS.SETTINGS && (
          <SettingsRoleSettings
            roleId={roleId}
            isEditable={isRoleEditable}
            isCreateMode={isCreateMode}
          />
        )}
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
