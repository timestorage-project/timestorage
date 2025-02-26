export const equipmentV1 = {
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://posacheck.com/equipmentv1.json',
    title: 'Data & Wizard Structure Schema',
    type: 'object',
    description: "A schema that validates sections of type 'data' or 'wizard'.",
    patternProperties: {
      '^.+$': {
        $ref: '#/$defs/Section',
      },
    },
    additionalProperties: false,
    $defs: {
      Section: {
        type: 'object',
        required: ['id', 'title', 'description', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier of this section.',
          },
          title: {
            type: 'string',
            description: 'i18n key for the section title.',
          },
          description: {
            type: 'string',
            description: 'i18n key for the section description.',
          },
          type: {
            type: 'string',
            enum: ['data', 'wizard'],
            description: "Defines whether this section is a 'data' section or a 'wizard' section.",
          },
          icon: {
            type: 'string',
            description: 'Optional icon for visual representation.',
          },
          children: {
            type: 'array',
            description: "List of data items if this section is type 'data'.",
            items: {
              $ref: '#/$defs/DataItem',
            },
          },
          questions: {
            type: 'array',
            description: "List of wizard questions if this section is type 'wizard'.",
            items: {
              $ref: '#/$defs/WizardQuestion',
            },
          },
        },
        allOf: [
          {
            if: {
              properties: {
                type: {
                  const: 'data',
                },
              },
            },
            then: {
              required: ['children'],
              properties: {
                questions: {
                  maxItems: 0,
                },
              },
            },
          },
          {
            if: {
              properties: {
                type: {
                  const: 'wizard',
                },
              },
            },
            then: {
              required: ['questions'],
              properties: {
                children: {
                  maxItems: 0,
                },
              },
            },
          },
        ],
      },
      DataItem: {
        type: 'object',
        required: ['label', 'value'],
        properties: {
          icon: {
            type: 'string',
            description: 'Optional icon (emoji or string) to display next to the data.',
          },
          label: {
            type: 'string',
            description: 'i18n key describing what this field represents.',
          },
          value: {
            type: 'string',
            description: 'Reference or actual string to store the data.',
          },
          fileType: {
            type: 'string',
            description: 'Type of file (PDF, image, etc.) that this field represents.',
          },
        },
        additionalProperties: false,
      },
      WizardQuestion: {
        type: 'object',
        required: ['id', 'type', 'question'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for this question.',
          },
          type: {
            type: 'string',
            enum: ['text', 'select', 'multiselect', 'photo', 'multiphoto'],
            description: 'Question type.',
          },
          question: {
            type: 'string',
            description: 'i18n key for the question text.',
          },
          options: {
            type: 'array',
            description: "List of choices (only required for 'select' or 'multiselect').",
            items: {
              type: 'string',
            },
          },
          refId: {
            type: 'string',
            description: 'Pointer to the data field where this answer should be stored.',
          },
          conditions: {
            type: 'array',
            description: 'Optional array describing conditional logic for this question.',
            items: {
              $ref: '#/$defs/Condition',
            },
          },
        },
        allOf: [
          {
            if: {
              properties: {
                type: {
                  enum: ['select', 'multiselect'],
                },
              },
            },
            then: {
              required: ['options'],
            },
          },
        ],
        additionalProperties: false,
      },
      Condition: {
        type: 'object',
        required: ['questionId', 'operator', 'value', 'action'],
        properties: {
          questionId: {
            type: 'string',
            description: 'ID of another question on which this question depends.',
          },
          operator: {
            type: 'string',
            enum: ['equals', 'notEquals', 'in', 'notIn', 'greaterThan', 'lessThan'],
            description: 'Operator to evaluate.',
          },
          value: {
            type: ['string', 'number', 'boolean', 'array'],
            description: 'Value to compare against the answer of questionId.',
          },
          action: {
            type: 'string',
            enum: ['show', 'hide', 'enable', 'disable', 'require', 'optional'],
            description: 'Action to perform if condition is met.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  data: {
    productInfo: {
      id: 'product-info',
      title: 'PRODUCT_INFO_TITLE',
      description: 'PRODUCT_INFO_DESCRIPTION',
      type: 'data',
      icon: 'info',
      children: [
        {
          icon: '📏',
          label: 'DIMENSIONS_LABEL',
          value: '#/values/productInfo/dimensions',
        },
        {
          icon: '🔢',
          label: 'MODEL_NUMBER_LABEL',
          value: '#/values/productInfo/modelNumber',
        },
        {
          icon: '🏗️',
          label: 'MATERIAL_TYPE_LABEL',
          value: '#/values/productInfo/materialType',
        },
        {
          icon: '🪟',
          label: 'GLASS_TYPE_LABEL',
          value: '#/values/productInfo/glassType',
        },
        {
          icon: '⚡',
          label: 'ENERGY_RATING_LABEL',
          value: '#/values/productInfo/energyRating',
        },
        {
          icon: '📅',
          label: 'MANUFACTURING_DATE_LABEL',
          value: '#/values/productInfo/manufacturingDate',
        },
        {
          icon: '🔢',
          label: 'SERIAL_NUMBER_LABEL',
          value: '#/values/productInfo/serialNumber',
        },
        {
          icon: '📋',
          label: 'INSTALLATION_STATUS_LABEL',
          value: '#/values/productInfo/installationStatus',
        },
        {
          icon: '🪟',
          label: 'WINDOW_TYPE_LABEL',
          value: '#/values/productInfo/windowType',
        },
      ],
    },
    productDocuments: {
      id: 'product-documents',
      title: 'PRODUCT_DOCUMENTS_TITLE',
      description: 'PRODUCT_DOCUMENTS_DESCRIPTION',
      type: 'data',
      icon: 'description',
      children: [
        {
          icon: '📄',
          label: 'SCHEDA_TECNICA_LABEL',
          value: '#/values/productDocuments/schedaTecnica',
          fileType: 'PDF',
        },
        {
          icon: '📄',
          label: 'DICHIARAZIONE_SOSTANZE_PERICOLOSE_LABEL',
          value: '#/values/productDocuments/dichiarazioneSostanzePericolose',
          fileType: 'PDF',
        },
        {
          icon: '📄',
          label: 'DICHIARAZIONE_DI_PRESTAZIONE_LABEL',
          value: '#/values/productDocuments/dichiarazioneDiPrestazione',
          fileType: 'PDF',
        },
      ],
    },
    ceMarking: {
      id: 'ce-marking',
      title: 'CE_MARKING_TITLE',
      description: 'CE_MARKING_DESCRIPTION',
      type: 'data',
      icon: 'verified',
      children: [
        {
          icon: '📄',
          label: 'MARCATURA_CE_LABEL',
          value: '#/values/ceMarking/marcaturaCE',
          fileType: 'PDF',
        },
        {
          icon: '📄',
          label: 'ETICHETTA_CE_LABEL',
          value: '#/values/ceMarking/etichettaCE',
          fileType: 'PDF',
        },
      ],
    },
    maintenanceDocuments: {
      id: 'maintenance-documents',
      title: 'MAINTENANCE_DOCUMENTS_TITLE',
      description: 'MAINTENANCE_DOCUMENTS_DESCRIPTION',
      type: 'data',
      icon: 'build',
      children: [
        {
          icon: '📄',
          label: 'MANUALE_DI_MANUTENZIONE_LABEL',
          value: '#/values/maintenanceDocuments/manualeDiManutenzione',
          fileType: 'PDF',
        },
      ],
    },
    installationInformation: {
      id: 'installation-information',
      title: 'INSTALLATION_INFORMATION_TITLE',
      description: 'INSTALLATION_INFORMATION_DESCRIPTION',
      type: 'data',
      icon: 'construction',
      children: [
        {
          icon: '👤',
          label: 'INSTALLER_NAME_LABEL',
          value: '#/values/installationInformation/installerName',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_FRONTALE_ALTO_SX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioFrontaleAltoSX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_FRONTALE_BASSO_SX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioFrontaleBassaSX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_FRONTALE_ALTO_DX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioFrontaleAltoDX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_FRONTALE_BASSO_DX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioFrontaleBassoDX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_FRONTALE_GENERALE_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioFrontaleGenerale',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_LATERALE_ALTO_SX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioLateraleAltoSX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_LATERALE_BASSO_SX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioLateraleBassaSX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_LATERALE_ALTO_DX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioLateraleAltoDX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_LATERALE_BASSO_DX_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioLateraleBassoDX',
          fileType: 'image',
        },
        {
          icon: '📷',
          label: 'GIUNTO_SECONDARIO_LATERALE_GENERALE_LABEL',
          value: '#/values/installationInformation/giuntoSecondarioLateraleGenerale',
          fileType: 'image',
        },
      ],
    },
    installationInformationWizard: {
      id: 'installation-information-wizard',
      title: 'INSTALLATION_INFORMATION_WIZARD_TITLE',
      description: 'INSTALLATION_INFORMATION_WIZARD_DESCRIPTION',
      type: 'wizard',
      icon: 'construction',
      questions: [
        {
          id: 'installer_name',
          type: 'text',
          question: 'INSTALLER_NAME_QUESTION',
          refId: '#/values/installationInformation/installerName',
        },
        {
          id: 'giunto_secondario_frontale_alto_sx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_FRONTALE_ALTO_SX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioFrontaleAltoSX',
        },
        {
          id: 'giunto_secondario_frontale_basso_sx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_FRONTALE_BASSO_SX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioFrontaleBassaSX',
        },
        {
          id: 'giunto_secondario_frontale_alto_dx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_FRONTALE_ALTO_DX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioFrontaleAltoDX',
        },
        {
          id: 'giunto_secondario_frontale_basso_dx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_FRONTALE_BASSO_DX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioFrontaleBassoDX',
        },
        {
          id: 'giunto_secondario_frontale_generale',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_FRONTALE_GENERALE_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioFrontaleGenerale',
        },
        {
          id: 'giunto_secondario_laterale_alto_sx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_LATERALE_ALTO_SX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioLateraleAltoSX',
        },
        {
          id: 'giunto_secondario_laterale_basso_sx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_LATERALE_BASSO_SX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioLateraleBassaSX',
        },
        {
          id: 'giunto_secondario_laterale_alto_dx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_LATERALE_ALTO_DX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioLateraleAltoDX',
        },
        {
          id: 'giunto_secondario_laterale_basso_dx',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_LATERALE_BASSO_DX_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioLateraleBassoDX',
        },
        {
          id: 'giunto_secondario_laterale_generale',
          type: 'photo',
          question: 'GIUNTO_SECONDARIO_LATERALE_GENERALE_QUESTION',
          refId: '#/values/installationInformation/giuntoSecondarioLateraleGenerale',
        },
      ],
    },
  },
};
