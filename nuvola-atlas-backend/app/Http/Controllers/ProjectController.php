<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::query();

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->input('zone_id'));
        }

        return ProjectResource::collection($query->paginate(15));
    }

    public function show(string $id)
    {
        return new ProjectResource(Project::findOrFail($id));
    }
}
