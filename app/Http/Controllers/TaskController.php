<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    // 1. Ambil semua data tugas
    public function index()
    {
        return response()->json(Task::latest()->get());
    }

    // 2. Tambah tugas baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'column_id' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:high,medium,low',
            'category' => 'required|string',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create($validated);

        return response()->json($task, 201);
    }

    // 3. Update data tugas / pindahkan kolom
    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'column_id' => 'sometimes|string',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|in:high,medium,low',
            'category' => 'sometimes|string',
            'due_date' => 'nullable|date',
        ]);

        $task->update($validated);

        return response()->json($task);
    }

    // 4. Hapus tugas
    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }
}