<?php

declare(strict_types=1);

/**
 * Vitality Index — 4 equally-weighted pillars, 13 indicators sourced via
 * the Daystar University data-access partnership. Every pillar contributes
 * 0.25 to the composite; every indicator inside a pillar contributes an
 * equal share of its pillar. Missing indicators are excluded from the
 * average (never treated as zero) — see ScoreCalculator.
 *
 * Reference: PHASES.md, section "Vitality Index Structure".
 *
 * All legacy metrics (SPI, Optimal Density Ratio, Urban Friction Index,
 * ESIA Transparency, Digital Sovereignty, etc.) were removed as of the
 * July 2026 overhaul. Do not reintroduce them.
 */

return [
    [
        'key' => 'social',
        'name' => 'Social Wellbeing & Human Capital',
        'description' => 'Whether the local population has access to the essentials for thriving — a low score forecasts labour shortages, skills gaps, and downstream service failures.',
        'source' => 'Daystar University · Social Wellbeing Panel',
        'indicators' => [
            [
                'key' => 'healthcare_access',
                'label' => 'Healthcare Access',
                'description' => 'Proximity to functioning primary + secondary care facilities; consultation availability under 24 hours.',
            ],
            [
                'key' => 'education_access',
                'label' => 'Education Access',
                'description' => 'Enrolment rates and physical proximity to primary, secondary, and TVET institutions in the locality.',
            ],
            [
                'key' => 'digital_connectivity',
                'label' => 'Digital Connectivity',
                'description' => 'Household broadband/mobile data coverage and median throughput as measured across the sub-county.',
            ],
        ],
    ],
    [
        'key' => 'safety',
        'name' => 'Safety & Security',
        'description' => 'Freedom from physical harm, emergency response gaps, and disaster exposure — the difference between operating and recovering.',
        'source' => 'Daystar University · Safety Data Panel',
        'indicators' => [
            [
                'key' => 'crime_rates',
                'label' => 'Crime Rates',
                'description' => 'Reported violent and property crime incidents per 10,000 residents, rolling 90-day window.',
            ],
            [
                'key' => 'emergency_response_access',
                'label' => 'Emergency Response Access',
                'description' => 'Median police, ambulance, and fire response times measured across the sub-county.',
            ],
            [
                'key' => 'disaster_exposure',
                'label' => 'Disaster Exposure',
                'description' => 'Exposure to flooding, landslide, and fire hazards as mapped against population density.',
            ],
        ],
    ],
    [
        'key' => 'density',
        'name' => 'Density & Scaling Dynamics',
        'description' => 'Whether density supports growth or strangles it. Poor scoring here predicts congestion, informal settlement pressure, and infrastructure overload.',
        'source' => 'Daystar University · Urban Density Panel',
        'indicators' => [
            [
                'key' => 'population_density',
                'label' => 'Population Density',
                'description' => 'Residents per square kilometre, normalized against Nairobi County median.',
            ],
            [
                'key' => 'congestion',
                'label' => 'Congestion',
                'description' => 'Median transit time between key sub-county nodes during peak hours vs off-peak baseline.',
            ],
            [
                'key' => 'housing_pressure',
                'label' => 'Housing Pressure',
                'description' => 'Ratio of housing units to households, share of informal/temporary structures.',
            ],
        ],
    ],
    [
        'key' => 'infra',
        'name' => 'Infrastructure & Environmental Safeguards',
        'description' => 'Whether the physical + environmental foundations are in place to sustain new projects: roads, power, food, and waste.',
        'source' => 'Daystar University · Infrastructure Panel',
        'indicators' => [
            [
                'key' => 'road_quality',
                'label' => 'Road Quality',
                'description' => 'Share of paved roads in usable condition (no significant potholes/flooding damage), rolling 12-month sample.',
            ],
            [
                'key' => 'energy_reliability',
                'label' => 'Energy Reliability',
                'description' => 'Grid uptime — average hours per week without outage per household connection.',
            ],
            [
                'key' => 'food_risk',
                'label' => 'Food Risk',
                'description' => 'Market access, price volatility, and proximity to consistent supply chains for staple goods.',
            ],
            [
                'key' => 'waste_management',
                'label' => 'Waste Management',
                'description' => 'Coverage of routine solid-waste collection and share of sub-county serviced by sewered or context-fit sanitation.',
            ],
        ],
    ],
];
