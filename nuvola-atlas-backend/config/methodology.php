<?php

return [
    [
        'key' => 'social',
        'name' => 'Social Wellbeing & Human Capital',
        'description' => 'Whether the local population is thriving. A low score predicts future labour issues or shortage of skilled operators.',
        'subMetrics' => [
            ['key' => 'spi', 'label' => 'Social Progress Index', 'description' => 'Basic medical care, access to amenities, and inclusiveness'],
            ['key' => 'workforce', 'label' => 'Workforce Mobility Score', 'description' => 'How easily labour and specialized roles can move in and out'],
            ['key' => 'livability', 'label' => 'Mental Health & Livability', 'description' => 'Access to green space, air quality, projected burnout'],
        ],
    ],
    [
        'key' => 'safety',
        'name' => 'Safety & Security',
        'description' => 'Freedom from physical, legal, and digital threats that could disrupt projects.',
        'subMetrics' => [
            ['key' => 'ruleOfLaw', 'label' => 'Rule of Law Stability', 'description' => 'Probability of contract expropriation, five-year judicial independence trend'],
            ['key' => 'physSecurity', 'label' => 'Infrastructure Physical Security', 'description' => 'Conflict heatmap, proximity to unrest or high-crime corridors'],
            ['key' => 'digitalSov', 'label' => 'Digital Sovereignty & Cybersecurity', 'description' => 'Internet Freedom Score, network outage frequency'],
        ],
    ],
    [
        'key' => 'density',
        'name' => 'Density & Scaling Dynamics',
        'description' => "Whether the region's density supports growth or constrains it.",
        'subMetrics' => [
            ['key' => 'optDensity', 'label' => 'Optimal Density Ratio', 'description' => 'Infrastructure Capacity / Population Density. Low ratio flags over-saturation'],
            ['key' => 'urbanFriction', 'label' => 'Urban Friction Index', 'description' => 'Average transit times for heavy equipment, zoning complexity'],
        ],
    ],
    [
        'key' => 'infra',
        'name' => 'Infrastructure & Environmental Safeguards',
        'description' => 'Whether documentation and legal architecture exist to back up large projects.',
        'subMetrics' => [
            ['key' => 'esia', 'label' => 'ESIA Transparency', 'description' => 'Are Environmental and Social Impact Assessments publicly available'],
            ['key' => 'sovImmunity', 'label' => 'Sovereign Immunity Risk', 'description' => 'Government accountability for breaches of infrastructure contracts'],
            ['key' => 'resourceSov', 'label' => 'Resource Sovereignty', 'description' => 'Legal protections on water and energy rights'],
            ['key' => 'waste', 'label' => 'Waste & Lifecycle Mandates', 'description' => 'Extended Producer Responsibility laws, decommissioning liabilities'],
            ['key' => 'circular', 'label' => 'Circular Economy Freedom', 'description' => 'Whether laws permit reuse of greywater and recycled construction materials'],
        ],
    ],
];
